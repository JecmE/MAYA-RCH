import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- PROCESO DE ARRANQUE MAYA RCH ---');
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // Azure Linux usa PORT o 8080 por defecto
  const port = process.env.PORT || 8080;

  // Escuchar en 0.0.0.0 y avisar a la consola
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 SERVIDOR ACTIVO EN PUERTO: ${port}`);
}
bootstrap();
