import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { ApiExceptionFilter } from 'src/core/filters/api-exception.filter';

const PORT = process.env.PORT || 8080;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  app.enableCors({
    exposedHeaders: [
      'X-Total-Count',
      'Current-Page',
      'Has-Next-Page',
      'Custom-Header',
    ],
  });

  await app.listen(PORT);
}
bootstrap()
  .then(() => {
    console.info(`Application is running on Port::${PORT}`);
  })
  .catch((error) => {
    console.error('Error during application bootstrap:', error);
  });
