import { createClient } from 'redis';

let redisClient = null;

// Redis опционален. Если недоступен — возвращаем null и работаем без него.
export const connectRedis = async () => {
  if (process.env.DISABLE_REDIS === 'true') {
    console.log('ℹ Redis отключён через DISABLE_REDIS=true');
    return null;
  }
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: () => false, // не пытаемся переподключаться, если упал
        connectTimeout: 1500,
      },
    });

    redisClient.on('error', () => {
      // Игнорируем — Redis опциональный
    });

    await redisClient.connect();
    console.log('✓ Redis подключён');
    return redisClient;
  } catch (error) {
    console.log('ℹ Redis недоступен — продолжаем без кэша');
    redisClient = null;
    return null;
  }
};

export const getRedisClient = () => redisClient;
