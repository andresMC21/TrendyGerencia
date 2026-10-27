import { Repository } from 'typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
export declare class ReviewService {
    private readonly reviewRepository;
    private readonly transactionRepository;
    private readonly userRepository;
    constructor(reviewRepository: Repository<Review>, transactionRepository: Repository<Transaction>, userRepository: Repository<User>);
    create(reviewerId: string, createReviewDto: CreateReviewDto): Promise<ReviewDto>;
    findAll(userId: string): Promise<ReviewDto[]>;
    findOne(id: string, userId: string): Promise<ReviewDto>;
    update(id: string, reviewerId: string, updateReviewDto: UpdateReviewDto): Promise<ReviewDto>;
    remove(id: string, reviewerId: string): Promise<void>;
    private findEntity;
    private assertParticipant;
    private assertReviewParticipant;
    private refreshUserRating;
}
