import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis | null => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          console.warn('⚠️  REDIS_URL not configured — running without Redis cache');
          return null;
        }
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            if (times > 3) {
              console.error('❌ Redis connection failed after 3 retries');
              return null;
            }
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        });

        let errorCount = 0;
        client.connect().catch(() => {
          console.warn('⚠️  Redis unavailable — cache disabled, API continues without it');
        });

        client.on('connect', () => console.log('✅ Redis connected'));
        client.on('error', (err) => {
          errorCount++;
          if (errorCount <= 2) {
            console.warn(`⚠️  Redis error: ${err.message || 'connection refused'}`);
          }
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
