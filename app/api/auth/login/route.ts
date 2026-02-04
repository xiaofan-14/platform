import prisma from "@/app/lib/prismaClient";
import { verifyPassword } from "@/app/lib/utils/crypto";
import { createSession } from "@/app/lib/session";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/login
 * 请求体: { username: string, password: string }
 * 成功：创建 Session（DB + Redis），设置 httpOnly Cookie，返回用户信息
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { message: "请输入用户名和密码" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { username, deletedAt: null },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json(
        { message: "用户名或密码错误" },
        { status: 401 }
      );
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await createSession(user.id, { ipAddress, userAgent });

    return NextResponse.json(
      {
        message: "登录成功",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      {
        message: "服务器错误",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
