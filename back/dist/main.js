"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const api_error_response_dto_1 = require("./common/dto/api-error-response.dto");
const document_api_errors_1 = require("./common/swagger/document-api-errors");
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
});
async function bootstrap() {
    try {
        console.log('🚀 Iniciando aplicación...');
        console.log('PORT:', process.env.PORT);
        console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
        console.log('NODE_ENV:', process.env.NODE_ENV);
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
        app.setGlobalPrefix('api');
        app.enableCors();
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('Trendy API')
            .setDescription('API del marketplace hiperlocal de segunda mano Trendy. Los endpoints protegidos requieren el JWT obtenido al iniciar sesión; los permisos específicos se indican en cada operación. Las respuestas de error usan el esquema común ApiErrorResponseDto, con statusCode, message y error requeridos. En los errores de validación, message es una lista de mensajes; consulta el esquema para ver sus propiedades y ejemplos.')
            .setVersion('1.0')
            .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT obtenido en /api/user/login',
        }, 'JWT-auth')
            .build();
        const document = (0, document_api_errors_1.documentApiErrors)(swagger_1.SwaggerModule.createDocument(app, swaggerConfig, {
            extraModels: [api_error_response_dto_1.ApiErrorResponseDto],
        }));
        swagger_1.SwaggerModule.setup('/api/docs', app, document);
        const port = Number(process.env.PORT) || 3000;
        await app.listen(port, '0.0.0.0');
        console.log(`✅ Application is running on port ${port}`);
    }
    catch (error) {
        console.error('❌ Error fatal durante el arranque:');
        console.error(error);
        process.exit(1);
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map