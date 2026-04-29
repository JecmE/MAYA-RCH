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

  // En Azure Linux, el puerto es obligatorio y lo da la máquina
  const port = process.env.PORT || 8080;

  // Escuchar en 0.0.0.0 es la ÚNICA forma de que el contenedor sea visible
  await app.listen(port, '0.0.0.0');
  console.log(`Servidor iniciado en puerto: ${port}`);
}
bootstrap();
