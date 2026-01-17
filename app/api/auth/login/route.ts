import redisClient from "@/app/lib/redisClient";
import prisma from "@/app/lib/prismaClient";
import { NextResponse } from "next/server";
import { User } from "@/app/generated/prisma/browser";

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
    
        if (!username || !password) {
            return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
        }

        // 从数据库查询用户
       
        // TODO: 验证密码（实际应用中应该使用 bcrypt 等加密库）
        // if (user.password !== hashedPassword) {
        //     return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
        // }

        // 先返回用户信息
        return NextResponse.json({  }, { status: 200 });
    } catch (error) {
        console.error('Auth API Error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
