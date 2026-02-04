import prisma from "@/app/lib/prismaClient";
import { hashPassword } from "@/app/lib/utils/crypto";
import { NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * /api/auth/register
 * 注册接口
 * 请求体: { username: string, email: string, password: string }
 * 返回体: { message: string, user: { id: number, username: string, email: string, createdAt: string } }
 */
export async function POST(request: Request) {
  try {
    /** 获取请求参数 */
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    /** 验证请求参数 */
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "用户名、邮箱和密码均为必填" },
        { status: 400 }
      );
    }

    /** 验证密码长度 */
    if (password.length < 6) {
      return NextResponse.json(
        { message: "密码长度至少为 6 位" },
        { status: 400 }
      );
    }

    /** 验证邮箱格式 */
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    /** 检查用户是否已存在 */
    const existing = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ username }, { email }],
      },
    });

    /** 如果用户已存在，返回错误 */
    if (existing) {
      if (existing.username === username) {
        return NextResponse.json(
          { message: "该用户名已被注册" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    /** 哈希密码 */
    const hashedPassword = hashPassword(password);

    /** 创建用户 */
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
        message: "注册成功",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      {
        message: "服务器错误",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
