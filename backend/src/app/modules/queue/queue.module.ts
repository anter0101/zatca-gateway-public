import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

export const ONBOARD_QUEUE = 'onboard';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        if (url) {
          return { connection: { url } };
        }
        return {
          connection: {
            host: config.get<string>('REDIS_HOST') || 'localhost',
            port: Number(config.get<string>('REDIS_PORT') || 6379),
          },
        };
      },
    }),
    BullModule.registerQueue({ name: ONBOARD_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
