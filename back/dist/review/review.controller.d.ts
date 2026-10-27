import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    create(user: User, createReviewDto: CreateReviewDto): Promise<ReviewDto>;
    findAll(user: User): Promise<ReviewDto[]>;
    findOne(id: string, user: User): Promise<ReviewDto>;
    update(id: string, user: User, updateReviewDto: UpdateReviewDto): Promise<ReviewDto>;
    remove(id: string, user: User): Promise<void>;
}
