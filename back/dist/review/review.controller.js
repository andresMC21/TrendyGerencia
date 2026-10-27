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
exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorator_1 = require("../user/decorators/auth.decorator");
const get_user_decorator_1 = require("../user/decorators/get-user.decorator");
const user_entity_1 = require("../user/entities/user.entity");
const create_review_dto_1 = require("./dto/create-review.dto");
const review_dto_1 = require("./dto/review.dto");
const update_review_dto_1 = require("./dto/update-review.dto");
const review_service_1 = require("./review.service");
let ReviewController = class ReviewController {
    reviewService;
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    create(user, createReviewDto) {
        return this.reviewService.create(user.id, createReviewDto);
    }
    findAll(user) {
        return this.reviewService.findAll(user.id);
    }
    findOne(id, user) {
        return this.reviewService.findOne(id, user.id);
    }
    update(id, user, updateReviewDto) {
        return this.reviewService.update(id, user.id, updateReviewDto);
    }
    remove(id, user) {
        return this.reviewService.remove(id, user.id);
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear una reseña para una transacción completada',
        description: 'Requiere JWT. Solo pueden reseñar los participantes de una transacción completada. Cada participante puede dejar una reseña para la contraparte; el promedio y el conteo de reseñas de esta se recalculan.',
    }),
    (0, swagger_1.ApiBody)({
        type: create_review_dto_1.CreateReviewDto,
        description: 'Transacción completada, calificación y comentario opcional.',
    }),
    (0, swagger_1.ApiCreatedResponse)({
        type: review_dto_1.ReviewDto,
        description: 'La reseña se creó para la contraparte de la transacción.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El cuerpo no cumple las validaciones: transactionId debe ser UUID, rating un entero de 1 a 5 y comment una cadena de hasta 1000 caracteres.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe una transacción con el identificador indicado.',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'La transacción no está completada o el usuario ya creó una reseña para ella.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no participa en la transacción.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al crear la reseña o actualizar la calificación.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar reseñas escritas o recibidas por el usuario autenticado',
        description: 'Requiere JWT. Devuelve reseñas escritas y recibidas por el usuario autenticado, ordenadas de la más reciente a la más antigua.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: [review_dto_1.ReviewDto],
        description: 'Lista de reseñas escritas o recibidas por el usuario; puede estar vacía.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar las reseñas.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar una reseña',
        description: 'Requiere JWT. Solo pueden verla quien la escribió y quien la recibió.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '{{reviewId}}',
        description: 'Identificador UUID de la reseña.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: review_dto_1.ReviewDto,
        description: 'Se devuelve la reseña solicitada.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador de la reseña no tiene formato UUID.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe una reseña con ese identificador.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no escribió ni recibió esta reseña.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar la reseña.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Actualizar una reseña propia',
        description: 'Requiere JWT. Solo el autor puede modificarla. Se pueden actualizar rating y/o comment; enviar comment como null lo elimina. El promedio y el conteo de reseñas de la persona evaluada se recalculan.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '{{reviewId}}',
        description: 'Identificador UUID de la reseña que se desea actualizar.',
    }),
    (0, swagger_1.ApiBody)({
        type: update_review_dto_1.UpdateReviewDto,
        description: 'Campos rating y/o comment que se desean modificar.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: review_dto_1.ReviewDto,
        description: 'La reseña se actualizó y se devuelve con sus nuevos valores.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador no tiene formato UUID o el cuerpo contiene valores no válidos.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe una reseña con ese identificador.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no es el autor de la reseña.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al actualizar la reseña o recalcular la calificación.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User,
        update_review_dto_1.UpdateReviewDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorator_1.Auth)(),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiOperation)({
        summary: 'Eliminar una reseña propia',
        description: 'Requiere JWT. Solo el autor puede eliminarla. El promedio y el conteo de reseñas de la persona evaluada se recalculan.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '{{reviewId}}',
        description: 'Identificador UUID de la reseña que se desea eliminar.',
    }),
    (0, swagger_1.ApiNoContentResponse)({
        description: 'La reseña se eliminó; la respuesta no tiene cuerpo.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador de la reseña no tiene formato UUID.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe una reseña con ese identificador.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no es el autor de la reseña.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al eliminar la reseña o recalcular la calificación.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "remove", null);
exports.ReviewController = ReviewController = __decorate([
    (0, swagger_1.ApiTags)('Reviews'),
    (0, common_1.Controller)('review'),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
//# sourceMappingURL=review.controller.js.map