import Redis from 'ioredis';

export class RedisCache {
  private static instance: RedisCache;
  private redis: Redis;
  private isConnected: boolean = false;

  private constructor() {
    // Initialize Redis with fallback to localhost
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      this.isConnected = false;
    });
  }

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  async connect(): Promise<boolean> {
    try {
      await this.redis.connect();
      return true;
    } catch (error) {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.redis.get(key);
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.del(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.hset(key, field, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.redis.hget(key, field);
    } catch (error) {
      return null;
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      if (!this.isConnected) return null;
      return await this.redis.hgetall(key);
    } catch (error) {
      return null;
    }
  }

  async zadd(key: string, score: number, member: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.zadd(key, score, member);
      return true;
    } catch (error) {
      return false;
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isConnected) return [];
      return await this.redis.zrange(key, start, stop);
    } catch (error) {
      return [];
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.expire(key, seconds);
      return true;
    } catch (error) {
      return false;
    }
  }

  async flushall(): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.flushall();
      return true;
    } catch (error) {
      return false;
    }
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
    } catch (error) {
    }
  }
}

export const redisCache = RedisCache.getInstance();