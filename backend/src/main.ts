import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  console.log('--- STARTING MAYA RCH PRODUCTION SERVER ---');
  const app = await NestFactory.create(appModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(express.json({ limit: '10mb' }));
  app.setGlobalPrefix('api');

  // Azure Linux port mapping
  const port = process.env.PORT || 8080;

  // Listening on 0.0.0.0 is MANDATORY for Azure Container Instances
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is up and running on port ${port}`);
}
bootstrap();
