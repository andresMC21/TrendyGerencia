"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateReviewDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_review_dto_1 = require("./create-review.dto");
class UpdateReviewDto extends (0, swagger_1.PartialType)((0, swagger_1.PickType)(create_review_dto_1.CreateReviewDto, ['rating', 'comment'])) {
}
exports.UpdateReviewDto = UpdateReviewDto;
//# sourceMappingURL=update-review.dto.js.map