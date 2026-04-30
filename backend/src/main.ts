import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  // Azure requiere 0.0.0.0 y el puerto que ellos asignan
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Servidor activo en puerto: ${port}`);
}
bootstrap();
