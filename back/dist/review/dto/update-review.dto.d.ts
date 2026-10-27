import { CreateReviewDto } from './create-review.dto';
declare const UpdateReviewDto_base: import("@nestjs/common", { with: { "resolution-mode": "import" } }).Type<Partial<Pick<CreateReviewDto, "rating" | "comment">>>;
export declare class UpdateReviewDto extends UpdateReviewDto_base {
}
export {};
