import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- SYSTEM STARTING ---');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // Azure requiere que escuchemos en 0.0.0.0 y en el puerto que ellos dan (PORT)
  const port = process.env.PORT || 8080;

  await app.listen(port, '0.0.0.0');
  console.log(`✅ SERVER RUNNING ON PORT: ${port}`);
}
bootstrap();
