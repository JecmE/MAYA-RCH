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

  // Lógica universal: Detecta el puerto de Azure (Linux o Windows) o usa 3000 local.
  const port = process.env.PORT || process.env.WEBSITES_PORT || 8080;

  await app.listen(port);
  console.log(`MAYA RCH API running on port: ${port}`);
}
bootstrap();
