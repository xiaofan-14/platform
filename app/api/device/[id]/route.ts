import { NextResponse } from "next/server";
import prisma from "@/app/lib/prismaClient";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: '设备ID不能为空' },
        { status: 400 }
      );
    }

    // 从数据库获取设备信息
    const device = await prisma.device.findUnique({
      where: { id: parseInt(id) },
    });

    if (!device) {
      return NextResponse.json(
        { message: '设备不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: '获取设备详情成功',
        data: {
          id: device.id,
          name: device.name,
          cpuUsage: device.cpuUsage,
          status: device.status,
          createdAt: device.createdAt,
          updatedAt: device.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get device error:', error);
    return NextResponse.json(
      {
        message: '内部服务器错误',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
    const { message } = await request.json() as { message: string }
    
    console.log(message)

    return NextResponse.json({message: 'success'})
}