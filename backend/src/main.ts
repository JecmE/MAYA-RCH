import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL', 'http://localhost:4200'),
      'https://jolly-field-0ba3cdc10.2.azurestaticapps.net',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // PRIORIDAD DE PUERTO PARA AZURE
  // Usamos process.env.PORT que es el que Azure asigna dinámicamente
  const port = process.env.PORT || 8080;

  // Escuchar en 0.0.0.0 es obligatorio en Azure Linux para ser visible
  await app.listen(port, '0.0.0.0');
  console.log(`MAYA RCH API is now online on port: ${port}`);
}
bootstrap();
