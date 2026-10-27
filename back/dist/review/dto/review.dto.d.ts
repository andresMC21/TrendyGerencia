import { Review } from '../entities/review.entity';
export declare class ReviewUserDto {
    id: string;
    fullName: string;
}
export declare class ReviewDto {
    id: string;
    transactionId: string;
    reviewer: ReviewUserDto;
    targetUser: ReviewUserDto;
    rating: number;
    comment: string | null;
    createdAt: Date;
    static fromEntity(review: Review): ReviewDto;
}
