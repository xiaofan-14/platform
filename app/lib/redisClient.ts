// 使用 proxy 封装一个单例的redis客户端
import Redis from 'ioredis';

let redisInstance: Redis | null = null;

// 创建 Redis 实例的工厂函数
function createRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL as string);
    
    // 添加错误处理
    redisInstance.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    redisInstance.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }
  return redisInstance;
}

const redisClient = new Proxy({} as Redis, {
  get(_target, prop: string | symbol) {
    const client = createRedisClient();
    const value = (client as any)[prop];
    
    // 如果是函数，绑定 this 上下文
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  },
  
  set(_target, prop: string | symbol, value: any) {
    const client = createRedisClient();
    (client as any)[prop] = value;
    return true;
  },
  
  has(_target, prop: string | symbol) {
    const client = createRedisClient();
    return prop in client;
  },
  
  ownKeys(_target) {
    const client = createRedisClient();
    return Reflect.ownKeys(client);
  },
  
  getOwnPropertyDescriptor(_target, prop: string | symbol) {
    const client = createRedisClient();
    return Reflect.getOwnPropertyDescriptor(client, prop);
  }
});

export default redisClient;