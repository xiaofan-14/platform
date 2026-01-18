import prisma from "@/app/lib/prismaClient";
import {NextResponse} from "next/server";

export async function GET() {
  // TODO 验证用户权限

  // 获取列表
  const devices = await prisma.device.findMany();
  return NextResponse.json({
      data: devices
    }, {status: 200}
  );
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // 验证输入
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { message: '设备名称不能为空' },
        { status: 400 }
      );
    }

    // 检查设备名称是否已存在
    const existingDevice = await prisma.device.findUnique({
      where: { name: name.trim() },
    });

    if (existingDevice) {
      return NextResponse.json(
        { message: '设备名称已存在' },
        { status: 409 }
      );
    }

    // 创建新设备
    const device = await prisma.device.create({
      data: {
        name: name.trim(),
        cpuUsage: 0,
        status: 'offline',
      },
    });

    return NextResponse.json(
      {
        message: '设备注册成功',
        data: device,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Device registration error:', error);
    return NextResponse.json(
      {
        message: '内部服务器错误',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
