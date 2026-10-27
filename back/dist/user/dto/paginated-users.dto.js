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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedUsersDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const profile_dto_1 = require("./profile.dto");
class PaginatedUsersDto {
    data;
    total;
    limit;
    skip;
}
exports.PaginatedUsersDto = PaginatedUsersDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [profile_dto_1.UserProfileDto],
        description: 'Usuarios incluidos en la página actual.',
    }),
    __metadata("design:type", Array)
], PaginatedUsersDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Cantidad total de usuarios coincidentes.',
    }),
    __metadata("design:type", Number)
], PaginatedUsersDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 20,
        description: 'Tamaño de página aplicado.',
    }),
    __metadata("design:type", Number)
], PaginatedUsersDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 0,
        description: 'Cantidad de usuarios omitidos.',
    }),
    __metadata("design:type", Number)
], PaginatedUsersDto.prototype, "skip", void 0);
//# sourceMappingURL=paginated-users.dto.js.map