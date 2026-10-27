"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const user_controller_1 = require("./user.controller");
const admin_user_controller_1 = require("./admin-user.controller");
const moderation_controller_1 = require("./moderation.controller");
const user_service_1 = require("./user.service");
let UserModule = class UserModule {
};
exports.UserModule = UserModule;
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.getOrThrow('JWT_SECRET'),
                    signOptions: { expiresIn: '1h' },
                }),
            }),
        ],
        controllers: [user_controller_1.UserController, admin_user_controller_1.AdminUserController, moderation_controller_1.ModerationController],
        providers: [user_service_1.UserService, jwt_strategy_1.JwtStrategy],
        exports: [typeorm_1.TypeOrmModule, passport_1.PassportModule, jwt_1.JwtModule, jwt_strategy_1.JwtStrategy, user_service_1.UserService],
    })
], UserModule);
//# sourceMappingURL=user.module.js.map