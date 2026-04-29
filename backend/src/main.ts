import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- INICIANDO BOOTSTRAP DE MAYA RCH ---');
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    app.enableCors({ origin: '*', credentials: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.use(express.json({ limit: '10mb' }));
    app.setGlobalPrefix('api');

    // Azure requiere 0.0.0.0 y el puerto de la variable process.env.PORT
    const port = process.env.PORT || 8080;
    console.log(`Intentando escuchar en puerto: ${port}`);

    await app.listen(port, '0.0.0.0');
    console.log(`✅ EXITO: Servidor escuchando en puerto: ${port}`);
  } catch (error) {
    console.error('❌ ERROR CRITICO EN EL ARRANQUE:', error);
    process.exit(1);
  }
}
bootstrap();
