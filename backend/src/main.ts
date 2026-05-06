import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // CONFIGURACIÓN DE HORA OFICIAL PARA GUATEMALA (UTC-6)
  process.env.TZ = 'America/Guatemala';

  console.log('--- SISTEMA MAYA RCH DESPEGANDO (ZONA HORARIA: GUATEMALA) ---');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 8080;

  await app.listen(port, '0.0.0.0');
  console.log(`✅ Maya RCH en línea! Hora servidor: ${new Date().toLocaleString('es-GT')}`);
}
bootstrap();
