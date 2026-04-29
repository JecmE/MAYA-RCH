import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- SISTEMA MAYA RCH DESPEGANDO ---');
  const app = await NestFactory.create(AppModule);

  // CORS LIBRE PARA PRODUCCIÓN: Esto quita el error de la consola
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // El puerto que Azure nos da por fuerza
  const port = process.env.PORT || 8080;

  // ESCUCHAR EN 0.0.0.0 ES LA CLAVE DEL ÉXITO
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Maya RCH en línea! Escuchando por el puerto: ${port}`);
}
bootstrap();
