import { Inject, Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  private get isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  async increment(
    key: string,
    ttl: number,
    _limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (!this.isAvailable) {
      return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
    }

    const redisKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:${throttlerName}:${key}:block`;

    const isBlocked = await this.redis!.get(blockKey);
    if (isBlocked) {
      const blockTtl = await this.redis!.pttl(blockKey);
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.max(0, Math.ceil(blockTtl / 1000)),
      };
    }

    const count = await this.redis!.incr(redisKey);
    if (count === 1) {
      await this.redis!.expire(redisKey, ttl);
    }

    const timeToExpire = await this.redis!.pttl(redisKey);
    const isNowBlocked = count > _limit;

    if (isNowBlocked && blockDuration > 0) {
      await this.redis!.setex(blockKey, blockDuration, '1');
      return {
        totalHits: count,
        timeToExpire: Math.max(0, Math.ceil(timeToExpire / 1000)),
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }

    return {
      totalHits: count,
      timeToExpire: Math.max(0, Math.ceil(timeToExpire / 1000)),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
