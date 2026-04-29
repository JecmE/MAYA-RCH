import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // En Azure, process.env.PORT es el puerto asignado.
  const port = process.env.PORT || 8080;

  // Escuchar en 0.0.0.0 es crítico para que el contenedor responda
  await app.listen(port, '0.0.0.0');
  console.log(`MAYA RCH API is running on port: ${port}`);
}
bootstrap();
