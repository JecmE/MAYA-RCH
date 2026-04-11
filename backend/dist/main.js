"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const express = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: 'http://localhost:4200',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.use(express.json({ limit: '10mb' }));
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`MAY A CRH API running on: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map