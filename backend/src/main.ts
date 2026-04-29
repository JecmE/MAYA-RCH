import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- INICIANDO SERVIDOR MAYA RCH ---');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS TOTAL: Permitimos todo para asegurar que el Login no se bloquee
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // Azure Linux asigna el puerto en process.env.PORT
  const port = process.env.PORT || 8080;

  // 0.0.0.0 es OBLIGATORIO en Azure para que el sitio sea visible
  await app.listen(port, '0.0.0.0');
  console.log(`✅ SERVIDOR LISTO Y ESCUCHANDO EN EL PUERTO: ${port}`);
}
bootstrap();
