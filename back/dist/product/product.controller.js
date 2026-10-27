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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_decorator_1 = require("../user/decorators/auth.decorator");
const get_user_decorator_1 = require("../user/decorators/get-user.decorator");
const user_entity_1 = require("../user/entities/user.entity");
const create_product_dto_1 = require("./dto/create-product.dto");
const find_products_query_dto_1 = require("./dto/find-products-query.dto");
const product_dto_1 = require("./dto/product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const product_service_1 = require("./product.service");
const product_condition_enum_1 = require("./enums/product-condition.enum");
const product_sort_enum_1 = require("./enums/product-sort.enum");
let ProductController = class ProductController {
    productService;
    constructor(productService) {
        this.productService = productService;
    }
    findAll(query) {
        return this.productService.findAll(query);
    }
    findOne(id) {
        return this.productService.findOne(id);
    }
    create(user, dto) {
        return this.productService.create(user.id, dto);
    }
    update(id, user, dto) {
        return this.productService.update(id, user.id, dto);
    }
    remove(id, user) {
        return this.productService.remove(id, user.id, user.role);
    }
    toggleFavorite(id, user) {
        return this.productService.toggleFavorite(id, user.id);
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Feed de productos',
        description: 'Público, no requiere JWT. Devuelve únicamente productos AVAILABLE. lat y lng deben enviarse juntos; radius se interpreta en kilómetros y solo aplica con ambos. sort=distance también requiere coordenadas.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'neighborhood',
        type: String,
        required: false,
        example: '{{neighborhoodId}}',
        description: 'Filtra por el identificador del barrio.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'lat',
        type: Number,
        required: false,
        example: 3.452,
        description: 'Latitud del punto de búsqueda; debe enviarse junto con lng.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'lng',
        type: Number,
        required: false,
        example: -76.531,
        description: 'Longitud del punto de búsqueda; debe enviarse junto con lat.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'radius',
        type: Number,
        required: false,
        example: 2,
        description: 'Radio de búsqueda en kilómetros (de 0.1 a 50); solo aplica con lat y lng.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'category',
        type: String,
        required: false,
        example: 'LIBROS',
        description: 'Filtra por categoría.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'condition',
        type: String,
        enum: product_condition_enum_1.ProductCondition,
        required: false,
        example: product_condition_enum_1.ProductCondition.USED,
        description: 'Filtra por condición del producto.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort',
        type: String,
        enum: product_sort_enum_1.ProductSort,
        required: false,
        example: product_sort_enum_1.ProductSort.PRICE_ASC,
        description: 'Ordena por fecha, precio, distancia o popularidad. distance requiere lat y lng.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        type: Number,
        required: false,
        example: 2,
        description: 'Número de página, empezando en 1.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        type: Number,
        required: false,
        example: 2,
        description: 'Cantidad de productos por página (de 1 a 50).',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: product_dto_1.PaginatedProductsDto,
        description: 'Feed paginado con productos AVAILABLE que coinciden con los filtros.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Algún filtro no es válido, falta lat o lng, o se solicita sort=distance sin coordenadas.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar el feed de productos.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_products_query_dto_1.FindProductsQueryDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Detalle de un producto',
        description: 'Público, no requiere JWT. Devuelve el producto y el perfil público del vendedor; cada consulta suma una visita.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del producto.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: product_dto_1.ProductDetailDto,
        description: 'Se devuelve el detalle del producto y su vendedor.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador del producto no tiene formato UUID.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe un producto con ese identificador o fue eliminado.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al consultar el producto.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Publicar un producto',
        description: 'Requiere JWT. El vendedor se toma del usuario autenticado; el producto inicia en estado AVAILABLE. Si no se especifican price y acceptsBarter, se usan 0 y false.',
    }),
    (0, swagger_1.ApiBody)({
        type: create_product_dto_1.CreateProductDto,
        description: 'Datos del producto que se desea publicar.',
    }),
    (0, swagger_1.ApiCreatedResponse)({
        type: product_dto_1.ProductDto,
        description: 'El producto se creó en estado AVAILABLE.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El cuerpo contiene campos no permitidos o valores que no cumplen las validaciones.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al crear el producto.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, auth_decorator_1.Auth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Editar un producto',
        description: 'Requiere JWT. Solo el vendedor puede editar el producto y únicamente mientras esté AVAILABLE.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del producto que se desea editar.',
    }),
    (0, swagger_1.ApiBody)({
        type: update_product_dto_1.UpdateProductDto,
        description: 'Campos del producto que se desean actualizar.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: product_dto_1.ProductDto,
        description: 'El producto se actualizó correctamente.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador o el cuerpo no cumplen las validaciones.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe un producto con ese identificador o fue eliminado.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario autenticado no es el vendedor del producto.',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'El producto no está AVAILABLE y no se puede editar en su estado actual.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al actualizar el producto.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User,
        update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, auth_decorator_1.Auth)(),
    (0, common_1.HttpCode)(204),
    (0, swagger_1.ApiOperation)({
        summary: 'Eliminar un producto (borrado lógico)',
        description: 'Requiere JWT. El vendedor o un ADMIN/MODERATOR pueden eliminarlo solo mientras esté AVAILABLE. Se conserva el registro y se cambia el estado a REMOVED.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del producto que se desea eliminar.',
    }),
    (0, swagger_1.ApiNoContentResponse)({
        description: 'El producto se marcó como REMOVED. La respuesta no tiene cuerpo.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador del producto no tiene formato UUID.',
    }),
    (0, swagger_1.ApiForbiddenResponse)({
        description: 'El usuario no es el vendedor y no tiene rol ADMIN ni MODERATOR.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe un producto con ese identificador o ya fue eliminado.',
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'El producto está reservado o vendido y no se puede eliminar.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al eliminar el producto.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/favorite'),
    (0, auth_decorator_1.Auth)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Marcar / desmarcar favorito',
        description: 'Requiere JWT. Alterna el favorito para el usuario autenticado y devuelve el nuevo estado.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: String,
        format: 'uuid',
        example: '00000000-0000-4000-8000-000000000000',
        description: 'Identificador UUID del producto que se desea marcar o desmarcar.',
    }),
    (0, swagger_1.ApiOkResponse)({
        type: product_dto_1.FavoriteResultDto,
        description: 'Se devuelve el nuevo estado del favorito.',
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'El identificador del producto no tiene formato UUID.',
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'No existe un producto con ese identificador o fue eliminado.',
    }),
    (0, swagger_1.ApiInternalServerErrorResponse)({
        description: 'Error inesperado al cambiar el estado del favorito.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "toggleFavorite", null);
exports.ProductController = ProductController = __decorate([
    (0, swagger_1.ApiTags)('Products'),
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [product_service_1.ProductService])
], ProductController);
//# sourceMappingURL=product.controller.js.map