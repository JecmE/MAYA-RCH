import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*', // Permitir todo momentáneamente para asegurar conexión en el primer arranque
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // En Azure Linux, el puerto es asignado por la infraestructura.
  const port = process.env.PORT || 8080;

  // Escuchar en 0.0.0.0 es obligatorio para contenedores en la nube
  await app.listen(port, '0.0.0.0');
  console.log(`Backend operando en puerto: ${port}`);
}
bootstrap();
