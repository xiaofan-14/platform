import { getSession } from "@/app/lib/session";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/session
 * 返回当前登录用户，未登录返回 401
 */
export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Session API Error:", error);
    return NextResponse.json(
      { message: "服务器错误" },
      { status: 500 }
    );
  }
}
