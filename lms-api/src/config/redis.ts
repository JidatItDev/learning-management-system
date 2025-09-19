import { createClient, RedisClientType } from 'redis';

const redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379';

const redis: RedisClientType = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 10000, // 10 seconds
  },
});

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err.message);
});

const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch (err) {
    if (err instanceof Error) {
      console.error('Failed to connect Redis:', err.message);
    } else {
      console.error('Failed to connect Redis:', err);
    }
  }
};

connectRedis();

export default redis;
