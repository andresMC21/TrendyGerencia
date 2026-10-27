"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const user_module_1 = require("./user/user.module");
const transaction_module_1 = require("./transaction/transaction.module");
const product_module_1 = require("./product/product.module");
const review_module_1 = require("./review/review.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('DATABASE_URL');
                    const nodeEnv = config.get('NODE_ENV');
                    const isProduction = nodeEnv === 'production';
                    const synchronize = (config.get('DB_SYNCHRONIZE') ?? config.get('TYPEORM_SYNCHRONIZE')) === 'true';
                    const sslSetting = config.get('DB_SSL');
                    const ssl = sslSetting !== undefined
                        ? sslSetting === 'true'
                            ? { rejectUnauthorized: false }
                            : false
                        : isProduction
                            ? { rejectUnauthorized: false }
                            : false;
                    return {
                        type: 'postgres',
                        ...(url
                            ? { url }
                            : {
                                host: config.get('DB_HOST'),
                                port: Number(config.get('DB_PORT') ?? 5432),
                                database: config.get('DB_NAME'),
                                username: config.get('DB_USERNAME'),
                                password: config.get('DB_PASSWORD'),
                            }),
                        ssl,
                        autoLoadEntities: true,
                        synchronize,
                        migrations: [__dirname + '/database/migrations/*{.ts,.js}']
                    };
                },
            }),
            user_module_1.UserModule,
            transaction_module_1.TransactionModule,
            product_module_1.ProductModule,
            review_module_1.ReviewModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map