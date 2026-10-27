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
exports.TransactionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorator_1 = require("../user/decorators/auth.decorator");
const get_user_decorator_1 = require("../user/decorators/get-user.decorator");
const user_entity_1 = require("../user/entities/user.entity");
const confirm_point_dto_1 = require("./dto/confirm-point.dto");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const transaction_dto_1 = require("./dto/transaction.dto");
const update_transaction_dto_1 = require("./dto/update-transaction.dto");
const transaction_service_1 = require("./transaction.service");
let TransactionController = class TransactionController {
    transactionService;
    constructor(transactionService) {
        this.transactionService = transactionService;
    }
    create(user, createTransactionDto) {
        return this.transactionService.create(user.id, createTransactionDto);
    }
    findAll(user) {
        return this.transactionService.findAll(user.id);
    }
    findOne(id, user) {
        return this.transactionService.findOne(id, user.id);
    }
    updateStatus(id, user, updateTransactionDto) {
        return this.transactionService.update(id, user.id, updateTransactionDto);
    }
    confirmPoint(id, user, confirmPointDto) {
        return this.transactionService.confirmPoint(id, user.id, confirmPointDto);
    }
};
exports.TransactionController = TransactionController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Iniciar una intención de compra o trueque',
        description: 'Requiere JWT. El usuario autenticado queda como comprador; el vendedor se obtiene del producto. La transacción inicia en PENDING y el producto queda reservado.',
    }),
    (0, swagger_1.ApiBody)({
        type: create_transaction_dto_1.CreateTransactionDto,
        description: 'Identificador del producto y mensaje opcional para el vendedor.',
    }),
    (0, swagger_1.ApiCreatedResponse)({
        type: transaction_dto_1.TransactionDto,
        description: 'La intención se creó en estado PENDING y el producto quedó reservado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El cuerpo no es válido, productId no tiene formato UUID o message supera 500 caracteres.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe el producto indicado.',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'El producto no está disponible o ya tiene una transacción activa.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado intenta comprar su propio producto.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al crear la transacción.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar las transacciones del usuario autenticado',
        description: 'Requiere JWT. Incluye las transacciones en las que participa como comprador o vendedor, ordenadas por última actualización.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: [transaction_dto_1.TransactionDto],
        description: 'Lista las transacciones en las que participa el usuario autenticado; puede estar vacía.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar las transacciones.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar una transacción',
        description: 'Requiere JWT. Solo pueden consultarla sus participantes.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID de la transacción.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: transaction_dto_1.TransactionDto,
        description: 'Se devuelve la transacción y sus datos relacionados.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador de la transacción no tiene formato UUID.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe una transacción con ese identificador.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no participa en la transacción.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar la transacción.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar estado de la transacción',
        description: 'Requiere JWT y participación en la transacción. Transiciones válidas: PENDING → AGREED_POINT/CANCELLED y AGREED_POINT → COMPLETED/CANCELLED. Para pasar a AGREED_POINT deben existir un punto seguro y un horario confirmados.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID de la transacción.',
    }),
    (0, swagger_1.ApiBody)({
        type: update_transaction_dto_1.UpdateTransactionDto,
        description: 'Nuevo estado solicitado para la transacción.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: transaction_dto_1.TransactionDto,
        description: 'La transacción se actualizó al estado solicitado.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador o el estado no son válidos, o faltan el punto seguro y el horario para pasar a AGREED_POINT.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe una transacción con ese identificador.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no participa en la transacción.',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'La transición solicitada no está permitida desde el estado actual.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al actualizar la transacción.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User,
        update_transaction_dto_1.UpdateTransactionDto]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/confirm-point'),
    (0, auth_decorator_1.Auth)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirmar punto seguro y horario de encuentro',
        description: 'Requiere JWT y participación en la transacción. Cualquier participante puede registrar el punto y el horario mientras la transacción esté PENDING. La operación cambia el estado a AGREED_POINT.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID de la transacción.',
    }),
    (0, swagger_1.ApiBody)({
        type: confirm_point_dto_1.ConfirmPointDto,
        description: 'Punto seguro y fecha/hora programada para el encuentro.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: transaction_dto_1.TransactionDto,
        description: 'El punto y la fecha se guardaron y la transacción pasó a AGREED_POINT.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador, el punto seguro o la fecha programada no son válidos.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe una transacción con ese identificador.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no participa en la transacción.',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'La transacción no está en estado PENDING.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al confirmar el punto de encuentro.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User,
        confirm_point_dto_1.ConfirmPointDto]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "confirmPoint", null);
exports.TransactionController = TransactionController = __decorate([
    (0, swagger_1.ApiTags)('Transactions'),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transaction_service_1.TransactionService])
], TransactionController);
//# sourceMappingURL=transaction.controller.js.map