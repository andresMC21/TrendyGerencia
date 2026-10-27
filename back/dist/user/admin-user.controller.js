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
exports.AdminUserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorator_1 = require("./decorators/auth.decorator");
const get_user_decorator_1 = require("./decorators/get-user.decorator");
const activeStatus_dto_1 = require("./dto/activeStatus.dto");
const adminUpdate_dto_1 = require("./dto/adminUpdate.dto");
const adminQuery_dto_1 = require("./dto/adminQuery.dto");
const changeRole_dto_1 = require("./dto/changeRole.dto");
const paginated_users_dto_1 = require("./dto/paginated-users.dto");
const profile_dto_1 = require("./dto/profile.dto");
const user_entity_1 = require("./entities/user.entity");
const valid_roles_enum_1 = require("./enums/valid-roles.enum");
const verification_status_1 = require("./enums/verification-status");
const user_service_1 = require("./user.service");
let AdminUserController = class AdminUserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    findAll(query) {
        return this.userService.findAll(query);
    }
    findOne(id) {
        return this.userService.findOneAdmin(id);
    }
    update(id, dto) {
        return this.userService.adminUpdate(id, dto);
    }
    changeRoles(admin, id, dto) {
        return this.userService.changeRoles(admin, id, dto);
    }
    setActiveStatus(admin, id, dto) {
        return this.userService.setActiveStatus(admin, id, dto);
    }
    remove(admin, id) {
        return this.userService.remove(admin, id);
    }
};
exports.AdminUserController = AdminUserController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.ADMIN, valid_roles_enum_1.ValidRoles.MODERATOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar usuarios para administración',
        description: 'ADMIN y MODERATOR pueden consultar usuarios activos e inactivos. Permite filtrar por rol, estado activo, estado de verificación y búsqueda parcial por nombre o correo.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        type: Number,
        required: false,
        example: 5,
        description: 'Cantidad de usuarios por página (de 1 a 100; predeterminado: 20).',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        type: Number,
        required: false,
        example: 0,
        description: 'Cantidad de usuarios que se omiten antes de iniciar la página.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'role',
        type: String,
        enum: valid_roles_enum_1.ValidRoles,
        required: false,
        example: valid_roles_enum_1.ValidRoles.ADMIN,
        description: 'Filtra por rol.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'isActive',
        type: Boolean,
        required: false,
        description: 'Filtra por estado activo (true) o inactivo (false).',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'verificationStatus',
        type: String,
        enum: verification_status_1.VerificationStatus,
        required: false,
        example: verification_status_1.VerificationStatus.PENDING,
        description: 'Filtra por estado de verificación.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        type: String,
        required: false,
        maxLength: 100,
        description: 'Coincidencia parcial por correo electrónico o nombre.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: paginated_users_dto_1.PaginatedUsersDto,
        description: 'Se devuelve la página de usuarios y el total que coincide con los filtros.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Uno o más filtros o parámetros de paginación no son válidos',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al listar los usuarios.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [adminQuery_dto_1.AdminUserQueryDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.ADMIN, valid_roles_enum_1.ValidRoles.MODERATOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar un usuario para administración',
        description: 'ADMIN y MODERATOR pueden consultar el perfil aunque la cuenta esté inactiva.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del usuario.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'Se devuelve el perfil del usuario solicitado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'El id no tiene formato UUID' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Usuario no encontrado' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar el usuario.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Editar los datos de perfil de un usuario',
        description: 'Solo ADMIN. Permite modificar fullName, email e info; roles, estado activo y verificación tienen operaciones independientes.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del usuario.',
    }),
    (0, swagger_1.ApiBody)({
        type: adminUpdate_dto_1.AdminUpdateUserDto,
        description: 'Campos de perfil que el administrador desea actualizar.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'El perfil se actualizó correctamente.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El id o el cuerpo de la solicitud es inválido',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Usuario no encontrado' }),
    (0, swagger_1.ApiConflictResponse)({ description: 'El correo ya está registrado' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al actualizar el perfil del usuario.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, adminUpdate_dto_1.AdminUpdateUserDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Reemplazar los roles de un usuario',
        description: 'Solo ADMIN. roles debe contener al menos un rol válido y sin duplicados. Un administrador no puede quitarse a sí mismo el rol ADMIN.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del usuario.',
    }),
    (0, swagger_1.ApiBody)({
        type: changeRole_dto_1.ChangeRole,
        description: 'Lista completa de roles que reemplazarán los actuales.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'Los roles se reemplazaron y se devuelve el perfil actualizado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'El id o los roles son inválidos' }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'No es posible quitarse el propio rol ADMIN',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Usuario no encontrado' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al cambiar los roles del usuario.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, changeRole_dto_1.ChangeRole]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "changeRoles", null);
__decorate([
    (0, common_1.Patch)(':id/active'),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Activar o desactivar una cuenta',
        description: 'Solo ADMIN. isActive=true reactiva la cuenta; false la desactiva. El administrador no puede desactivar su propia cuenta.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del usuario.',
    }),
    (0, swagger_1.ApiBody)({
        type: activeStatus_dto_1.SetActiveStatus,
        description: 'Nuevo estado de actividad de la cuenta.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'El estado de la cuenta se actualizó correctamente.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'El id o isActive son inválidos' }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'No es posible desactivar la propia cuenta',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Usuario no encontrado' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al cambiar el estado de la cuenta.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, activeStatus_dto_1.SetActiveStatus]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "setActiveStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorator_1.Auth)(valid_roles_enum_1.ValidRoles.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Desactivar un usuario (borrado lógico)',
        description: 'Solo ADMIN. Equivale a isActive=false y conserva el registro y las transacciones asociadas.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del usuario.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'La cuenta se desactivó y se devuelve el perfil actualizado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'El id no tiene formato UUID' }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'No es posible desactivar la propia cuenta',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Usuario no encontrado' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al desactivar el usuario.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "remove", null);
exports.AdminUserController = AdminUserController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Users'),
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], AdminUserController);
//# sourceMappingURL=admin-user.controller.js.map