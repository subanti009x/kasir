"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const cors_1 = require("./config/cors");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: (0, cors_1.getCorsOrigin)(),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Admin Solutions Inovatif API')
        .setDescription('Business Management & POS System Platform API')
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
        .addTag('accounting', 'Accounting & Financial Statements')
        .addTag('landing-page', 'Public Landing Page API')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 Admin Solutions Inovatif API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map