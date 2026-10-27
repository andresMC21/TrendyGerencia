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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorator_1 = require("./decorators/auth.decorator");
const get_user_decorator_1 = require("./decorators/get-user.decorator");
const changeEmail_dto_1 = require("./dto/changeEmail.dto");
const changePassword_dto_1 = require("./dto/changePassword.dto");
const auth_response_dto_1 = require("./dto/auth-response.dto");
const login_dto_1 = require("./dto/login.dto");
const profile_dto_1 = require("./dto/profile.dto");
const register_dto_1 = require("./dto/register.dto");
const update_dto_1 = require("./dto/update.dto");
const user_entity_1 = require("./entities/user.entity");
const user_service_1 = require("./user.service");
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    register(dto) {
        return this.userService.create(dto);
    }
    login(dto) {
        return this.userService.login(dto);
    }
    logout(user) {
        return this.userService.logout(user);
    }
    findMe(user) {
        return this.userService.findMe(user);
    }
    updateMe(user, dto) {
        return this.userService.updateMe(user, dto);
    }
    changePassword(user, dto) {
        return this.userService.changePassword(user, dto);
    }
    changeEmail(user, dto) {
        return this.userService.changeEmail(user, dto);
    }
    requestVerification(user) {
        return this.userService.requestVerification(user);
    }
    findOne(id) {
        return this.userService.findPublicProfile(id);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'Registrar una cuenta',
        description: 'Crea una cuenta USER activa con verificación UNVERIFIED. El correo se normaliza a minúsculas y la respuesta incluye el perfil y un JWT.',
    }),
    (0, swagger_1.ApiBody)({
        type: register_dto_1.RegisterUserDto,
        description: 'Datos para crear la cuenta.',
    }),
    (0, swagger_1.ApiCreatedResponse)({
        type: auth_response_dto_1.RegisterResponseDto,
        description: 'La cuenta se creó correctamente y se devuelve el perfil con un JWT.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El correo, la contraseña o el nombre no cumplen las reglas de validación',
    }),
    (0, swagger_1.ApiConflictResponse)({ description: 'Ya existe una cuenta con ese correo' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al crear la cuenta.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Iniciar sesión',
        description: 'Autentica una cuenta activa y devuelve su identificador y un JWT.',
    }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginUserDto, description: 'Credenciales de la cuenta.' }),
    (0, swagger_1.ApiOkResponse)({
        type: auth_response_dto_1.LoginResponseDto,
        description: 'La sesión se inició correctamente.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El correo o la contraseña tienen un formato inválido',
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({
        description: 'El correo no existe, la contraseña es incorrecta o la cuenta está inactiva.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al iniciar sesión.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Cerrar sesión',
        description: 'Invalida los tokens JWT previamente emitidos para el usuario autenticado. Requiere enviar un JWT válido.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: auth_response_dto_1.MessageResponseDto,
        description: 'La sesión se cerró correctamente.',
        example: { message: 'Session successfuly closed' },
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al cerrar la sesión.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar mi perfil',
        description: 'Devuelve el perfil asociado al JWT válido enviado en la cabecera Authorization.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'Se devuelve el perfil del usuario autenticado.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar el perfil.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", profile_dto_1.UserProfileDto)
], UserController.prototype, "findMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar el perfil propio',
        description: 'Permite cambiar fullName e info. fullName no se puede cambiar mientras la verificación esté PENDING o VERIFIED.',
    }),
    (0, swagger_1.ApiBody)({
        type: update_dto_1.UpdateUserDto,
        description: 'Campos del perfil que se desean actualizar.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'El perfil se actualizó correctamente.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'El cuerpo del perfil no es válido' }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'No se puede cambiar fullName en el estado de verificación actual',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'La cuenta no existe' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al actualizar el perfil.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        update_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Patch)('me/password'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Cambiar la contraseña',
        description: 'Requiere la contraseña actual. La nueva contraseña debe tener entre 8 y 12 caracteres y ser distinta a la actual.',
    }),
    (0, swagger_1.ApiBody)({
        type: changePassword_dto_1.ChangePasswordDto,
        description: 'Contraseña actual y contraseña nueva.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: auth_response_dto_1.MessageResponseDto,
        description: 'La contraseña se cambió correctamente.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'La nueva contraseña no cumple las reglas o es igual a la actual',
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'La contraseña actual es incorrecta' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al cambiar la contraseña.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        changePassword_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Patch)('me/email'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Cambiar el correo electrónico',
        description: 'Requiere la contraseña actual. El nuevo correo se normaliza a minúsculas y se eliminan espacios externos.',
    }),
    (0, swagger_1.ApiBody)({
        type: changeEmail_dto_1.ChangeEmailDto,
        description: 'Contraseña actual y correo nuevo.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'El correo se cambió correctamente y se devuelve el perfil actualizado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El correo no es válido o coincide con el actual',
    }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'La contraseña actual es incorrecta' }),
    (0, swagger_1.ApiConflictResponse)({ description: 'El correo ya está registrado' }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'La cuenta dejó de existir durante la operación.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al cambiar el correo electrónico.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        changeEmail_dto_1.ChangeEmailDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changeEmail", null);
__decorate([
    (0, common_1.Post)('me/verification'),
    (0, auth_decorator_1.Auth)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Solicitar verificación de identidad',
        description: 'Actualiza verificationStatus a PENDING. Devuelve el perfil actualizado; no acepta una nueva solicitud si la cuenta ya está PENDING o VERIFIED.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: profile_dto_1.UserProfileDto,
        description: 'La solicitud quedó pendiente y se devuelve el perfil actualizado.',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'La identidad ya está verificada o en revisión',
    }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'La cuenta no existe' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al solicitar la verificación.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "requestVerification", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar públicamente el perfil de un usuario activo',
        description: 'No requiere autenticación; los usuarios inactivos no se exponen en este endpoint.',
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
        description: 'Se devuelve el perfil del usuario activo solicitado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({ description: 'El id no tiene formato UUID' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Usuario inexistente o inactivo' }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar el usuario.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findOne", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map