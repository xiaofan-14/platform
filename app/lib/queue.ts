// BullMQ 队列配置
import { Queue } from 'bullmq';

// 使用连接选项对象，避免版本兼容性问题
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

// 如果提供了完整的 REDIS_URL，解析它
if (process.env.REDIS_URL) {
  try {
    const url = new URL(process.env.REDIS_URL);
    connection.host = url.hostname;
    connection.port = parseInt(url.port || '6379');
    connection.password = url.password || undefined;
  } catch (e) {
    // 如果 URL 解析失败，使用默认值
    console.warn('REDIS_URL 解析失败，使用默认配置');
  }
}

// 创建任务队列
export const jobQueue = new Queue('job-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 保留1小时
      count: 1000, // 最多保留1000个已完成的任务
    },
    removeOnFail: {
      age: 24 * 3600, // 保留24小时
    },
  },
});

export default jobQueue;
