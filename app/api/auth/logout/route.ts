import { destroySession } from "@/app/lib/session";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * 销毁当前 Session：删除 DB 与 Redis 中的记录，清除 Cookie
 */
export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ message: "已退出登录" }, { status: 200 });
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { message: "服务器错误" },
      { status: 500 }
    );
  }
}
