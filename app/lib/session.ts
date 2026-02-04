/**
 * 基于 Session 的认证：Cookie 存加密 sessionToken，PostgreSQL 存 Session，Redis 做缓存。
 * 校验时优先读 Redis，未命中再查 DB 并回填 Redis。
 */

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import prisma from "@/app/lib/prismaClient";
import redisClient from "@/app/lib/redisClient";

const COOKIE_NAME = "app_session";
const SESSION_MAX_AGE_DAYS = 7;
const SESSION_MAX_AGE_SEC = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
const REDIS_KEY_PREFIX = "session:";

export type SessionUser = {
  id: number;
  username: string;
  email: string;
};

export type SessionPayload = SessionUser & { expiresAt: string };

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return secret;
}

const defaultCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SEC,
  path: "/",
};

export interface SessionData {
  sessionToken?: string;
}

/** 从 Cookie 获取 iron-session 实例（仅含 sessionToken） */
export async function getSessionCookie() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, {
    password: getSessionPassword(),
    cookieName: COOKIE_NAME,
    cookieOptions: defaultCookieOptions,
  });
}

/** 从 Redis 取 Session 缓存，未命中则查 DB 并回填 Redis */
async function getSessionPayloadByToken(
  sessionToken: string
): Promise<SessionPayload | null> {
  const redisKey = REDIS_KEY_PREFIX + sessionToken;
  const cached = await redisClient.get(redisKey);
  if (cached) {
    try {
      return JSON.parse(cached) as SessionPayload;
    } catch {
      await redisClient.del(redisKey);
    }
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      await redisClient.del(redisKey).catch(() => {});
    }
    return null;
  }

  const payload: SessionPayload = {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    expiresAt: session.expires.toISOString(),
  };
  await redisClient.setex(
    redisKey,
    SESSION_MAX_AGE_SEC,
    JSON.stringify(payload)
  );
  return payload;
}

/**
 * 获取当前请求的 Session 用户（先 Cookie 取 token，再 Redis → DB 取用户信息）
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await getSessionCookie();
  const token = session.sessionToken;
  if (!token) return null;

  const payload = await getSessionPayloadByToken(token);
  if (!payload || new Date(payload.expiresAt) < new Date()) return null;

  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
  };
}

/**
 * 创建 Session：写入 DB、写入 Redis、设置 Cookie（加密的 sessionToken）
 */
export async function createSession(
  userId: number,
  options?: { ipAddress?: string; userAgent?: string }
): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      ipAddress: options?.ipAddress ?? null,
      userAgent: options?.userAgent ?? null,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true },
  });
  if (!user) throw new Error("User not found");

  const payload: SessionPayload = {
    ...user,
    expiresAt: expires.toISOString(),
  };
  const redisKey = REDIS_KEY_PREFIX + sessionToken;
  await redisClient.setex(redisKey, SESSION_MAX_AGE_SEC, JSON.stringify(payload));

  const session = await getSessionCookie();
  session.sessionToken = sessionToken;
  await session.save();

  return sessionToken;
}

/**
 * 销毁当前 Session：删 DB、删 Redis、清 Cookie
 */
export async function destroySession(): Promise<void> {
  const session = await getSessionCookie();
  const token = session.sessionToken;
  if (token) {
    const redisKey = REDIS_KEY_PREFIX + token;
    await redisClient.del(redisKey).catch(() => {});
    await prisma.session
      .deleteMany({ where: { sessionToken: token } })
      .catch(() => {});
  }
  session.sessionToken = undefined;
  await session.save();
}
