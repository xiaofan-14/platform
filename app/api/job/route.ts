import { NextResponse } from 'next/server';
import jobQueue from '@/app/lib/queue';

// 任务数据类型
export interface JobData {
  deviceId: string;
  type: string;
  payload?: any;
}

export async function POST(request: Request) {
  try {
    const body: JobData = await request.json();
    const { deviceId, type, payload } = body;

    // 验证必填字段
    if (!deviceId || !type) {
      return NextResponse.json(
        { message: 'deviceId 和 type 是必填字段' },
        { status: 400 }
      );
    }

    // 创建任务
    const job = await jobQueue.add(
      type,
      {
        deviceId,
        type,
        payload: payload || {},
        createdAt: new Date().toISOString(),
      },
      {
        // 可以根据任务类型设置不同的优先级
        priority: 1,
      }
    );

    return NextResponse.json(
      {
        message: '任务创建成功',
        data: {
          jobId: job.id,
          deviceId,
          type,
          status: 'created',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建任务失败:', error);
    return NextResponse.json(
      {
        message: '创建任务失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// 获取任务状态
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { message: 'jobId 参数是必填的' },
        { status: 400 }
      );
    }

    const job = await jobQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { message: '任务不存在' },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnvalue = job.returnvalue;
    const failedReason = job.failedReason;

    return NextResponse.json({
      data: {
        jobId: job.id,
        name: job.name,
        data: job.data,
        state,
        progress,
        returnvalue,
        failedReason,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      },
    });
  } catch (error) {
    console.error('获取任务状态失败:', error);
    return NextResponse.json(
      {
        message: '获取任务状态失败',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
