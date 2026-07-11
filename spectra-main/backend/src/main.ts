import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  // Serve uploaded media files statically
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ??
      false,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
