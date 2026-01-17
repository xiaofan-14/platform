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
        
        // 创建用户
        const user = await prisma.user.create({
            data: {
                username,
                password,
            },
        });

        
        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Auth API Error:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
