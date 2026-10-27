"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorator_1 = require("./decorators/auth.decorator");
const get_user_decorator_1 = require("./decorators/get-user.decorator");
const pagination_dto_1 = require("./dto/pagination.dto");
const verification_dto_1 = require("./dto/verification.dto");
const paginated_users_dto_1 = require("./dto/paginated-users.dto");
const user_entity_1 = require("./entities/user.entity");
const valid_roles_enum_1 = require("./enums/valid-roles.enum");
const profile_dto_1 = require("./dto/profile.dto");
const user_service_1 = require("./user.service");
let ModerationController = class ModerationController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    findPending(pagination) {
        return this.userService.findPendingVerifications(pagination);
    }
    resolve(moderator, userId, dto) {
        return this.userService.resolveVerification(moderator, userId, dto);
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.MODERATOR, valid_roles_enum_1.ValidRoles.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar solicitudes de verificación pendientes',
        description: 'ADMIN y MODERATOR pueden consultar solicitudes PENDING. Devuelve primero las solicitudes más antiguas; limit y skip controlan la paginación.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        type: Number,
        required: false,
        example: 100,
        description: 'Cantidad de solicitudes por página (de 1 a 100; predeterminado: 20).',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        type: Number,
        required: false,
        example: 0,
        description: 'Cantidad de solicitudes que se omiten antes de iniciar la página.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: paginated_users_dto_1.PaginatedUsersDto,
        description: 'Se devuelve la página de solicitudes pendientes en orden de antigüedad.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Los parámetros de paginación no son válidos',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al listar las solicitudes pendientes.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "findPending", null);
__decorate([
    (0, common_1.Patch)(':userId'),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.MODERATOR, valid_roles_enum_1.ValidRoles.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Resolver una solicitud de verificación',
        description: 'ADMIN y MODERATOR pueden aprobarla (approved=true) o rechazarla (false). reason es opcional, se incluye en los logs y no queda almacenado en el perfil. No se puede resolver la propia solicitud.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'userId',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del usuario solicitante.',
    }),
    (0, swagger_1.ApiBody)({
        type: verification_dto_1.ResolveVerification,
        description: 'Decisión de aprobación o rechazo y, opcionalmente, su motivo.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'La solicitud se resolvió y se devuelve el perfil actualizado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El id o el cuerpo de la solicitud es inválido',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'No se puede revisar la propia solicitud',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Usuario no encontrado' }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'El usuario no tiene una verificación pendiente',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al resolver la solicitud de verificación.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, verification_dto_1.ResolveVerification]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "resolve", null);
exports.ModerationController = ModerationController = __decorate([
    (0, swagger_1.ApiTags)('Moderation'),
    (0, common_1.Controller)('moderation/verifications'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map