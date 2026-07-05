"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('KasirPro Cloud API')
        .setDescription('Multi-tenant POS SaaS Platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('tenants', 'Tenant management')
        .addTag('users', 'User management')
        .addTag('products', 'Product management')
        .addTag('categories', 'Category management')
        .addTag('customers', 'Customer management')
        .addTag('suppliers', 'Supplier management')
        .addTag('inventory', 'Inventory management')
        .addTag('transactions', 'Transaction management')
        .addTag('purchase-orders', 'Purchase order management')
        .addTag('reports', 'Reporting & analytics')
        .addTag('settings', 'Tenant settings')
        .addTag('notifications', 'Notification system')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 KasirPro API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map