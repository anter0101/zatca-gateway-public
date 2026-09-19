import { NestFactory } from '@nestjs/core';
import { SeederModule } from './database/seeders/seeder.module';
import { Logger } from '@nestjs/common';
import { Seeder } from './database/seeders/seeder';

function bootstrap() {
  NestFactory.createApplicationContext(SeederModule)
    .then(async (appContext) => {
      const logger = appContext.get(Logger);
      const seeder = appContext.get<{ seed: () => Promise<void> }>(Seeder);
      try {
        await seeder.seed();
        logger.debug('Seeding complete!');
      } catch (error) {
        logger.error('Seeding failed!');
        throw error;
      } finally {
        await appContext.close();
      }
    })
    .catch((error) => {
      throw error;
    });
}
bootstrap();
