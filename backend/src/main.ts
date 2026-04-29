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

  // En Azure, el puerto se asigna mediante PORT o WEBSITES_PORT. Escuchamos en 0.0.0.0 para acceso externo.
  const port = process.env.PORT || process.env.WEBSITES_PORT || configService.get<number>('PORT', 3000);

  await app.listen(port, '0.0.0.0');
  console.log(`MAY A CRH API running on port: ${port}`);
}
bootstrap();
