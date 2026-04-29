import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- SISTEMA MAYA RCH INICIANDO ---');
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // Azure usa el puerto de la variable PORT por defecto
  const port = process.env.PORT || 8080;

  // Escuchar en 0.0.0.0 es LO MÁS IMPORTANTE en Azure Linux
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Servidor escuchando en: http://0.0.0.0:${port}`);
}
bootstrap();
