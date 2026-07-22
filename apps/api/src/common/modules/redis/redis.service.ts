import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis | null) {}

  get isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable) return null;
    return this.redis!.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable) return;
    if (ttlSeconds) {
      await this.redis!.setex(key, ttlSeconds, value);
    } else {
      await this.redis!.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable) return;
    await this.redis!.del(key);
  }

  async incr(key: string): Promise<number> {
    if (!this.isAvailable) return -1;
    return this.redis!.incr(key);
  }

  async incrWithTTL(key: string, ttlSeconds: number): Promise<number> {
    if (!this.isAvailable) return -1;
    const count = await this.redis!.incr(key);
    if (count === 1) {
      await this.redis!.expire(key, ttlSeconds);
    }
    return count;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable) return [];
    return this.redis!.keys(pattern);
  }

  async flushPattern(pattern: string): Promise<void> {
    if (!this.isAvailable) return;
    const keys = await this.redis!.keys(pattern);
    if (keys.length > 0) {
      await this.redis!.del(...keys);
    }
  }
}
