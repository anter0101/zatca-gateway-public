import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

export const ONBOARD_QUEUE = 'onboard';
export const INVOICE_QUEUE = 'invoice';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const prefix = config.get<string>('BULL_PREFIX') || 'bull';
        const url = config.get<string>('REDIS_URL');
        if (url) {
          return { connection: { url }, prefix };
        }
        return {
          connection: {
            host: config.get<string>('REDIS_HOST') || 'localhost',
            port: Number(config.get<string>('REDIS_PORT') || 6379),
          },
          prefix,
        };
      },
    }),
    BullModule.registerQueue(
      { name: ONBOARD_QUEUE },
      { name: INVOICE_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
