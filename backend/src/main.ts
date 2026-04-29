import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- MAYA RCH: INICIANDO MOTOR DE PRODUCCION ---');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*', // Permitir conexión desde el frontend de Azure
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // Azure usa el puerto de la variable PORT por defecto
  const port = process.env.PORT || 8080;

  // Escuchar en 0.0.0.0 es obligatorio en Azure Linux para que el tráfico fluya
  await app.listen(port, '0.0.0.0');
  console.log(`✅ MAYA RCH ONLINE: Puerto ${port}`);
}
bootstrap();
