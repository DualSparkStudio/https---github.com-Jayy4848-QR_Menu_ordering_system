import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

const logger = new Logger('RedisModule');

// No-op stub used when Redis is unavailable
const noopClient = {
  get: async () => null,
  set: async () => {},
  setEx: async () => {},
  del: async () => {},
  publish: async () => {},
  duplicate: () => ({ connect: async () => {}, subscribe: async () => {} }),
  incr: async () => 0,
  expire: async () => {},
  on: () => {},
};

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const host = configService.get('REDIS_HOST') || 'localhost';
        const port = parseInt(configService.get('REDIS_PORT') || '6379');

        return new Promise((resolve) => {
          const redis = require('redis');
          const client = redis.createClient({
            socket: { host, port, connectTimeout: 2000, reconnectStrategy: false },
            password: configService.get('REDIS_PASSWORD') || undefined,
          });

          const timeout = setTimeout(() => {
            logger.warn('Redis not available — running without cache/pub-sub');
            resolve(noopClient);
          }, 2500);

          client.on('ready', () => {
            clearTimeout(timeout);
            logger.log('Redis connected');
            resolve(client);
          });

          client.on('error', () => {});

          client.connect().catch(() => {
            clearTimeout(timeout);
            logger.warn('Redis not available — running without cache/pub-sub');
            resolve(noopClient);
          });
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
