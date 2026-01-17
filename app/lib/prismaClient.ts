// 使用单例模式封装 Prisma 客户端
import { PrismaClient } from '@/app/generated/prisma/client';

let prismaInstance: PrismaClient | null = null;

// 创建 Prisma 实例的工厂函数
function createPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    // PrismaClient 构造函数需要传入配置对象（即使是空对象）
    prismaInstance = new PrismaClient({} as any);

    // 添加错误处理
    prismaInstance.$on('error' as never, (e: any) => {
      console.error('Prisma Client Error:', e);
    });
  }
  return prismaInstance;
}

// 使用 Proxy 封装单例 Prisma 客户端
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = createPrismaClient();
    const value = (client as any)[prop];
    
    // 如果是函数，绑定 this 上下文
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  },
  
  set(_target, prop: string | symbol, value: any) {
    const client = createPrismaClient();
    (client as any)[prop] = value;
    return true;
  },
  
  has(_target, prop: string | symbol) {
    const client = createPrismaClient();
    return prop in client;
  },
  
  ownKeys(_target) {
    const client = createPrismaClient();
    return Reflect.ownKeys(client);
  },
  
  getOwnPropertyDescriptor(_target, prop: string | symbol) {
    const client = createPrismaClient();
    return Reflect.getOwnPropertyDescriptor(client, prop);
  }
});

export default prisma;
