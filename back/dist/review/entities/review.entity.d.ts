import { User } from '../../user/entities/user.entity';
export declare class Review {
    id: string;
    transactionId: string;
    reviewerId: string;
    reviewer: User;
    targetUserId: string;
    targetUser: User;
    rating: number;
    comment: string | null;
    createdAt: Date;
}
