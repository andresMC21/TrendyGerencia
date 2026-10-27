import { ValidRoles } from '../enums/valid-roles.enum';
import { VerificationStatus } from '../enums/verification-status';
import { User } from '../entities/user.entity';
export declare class UserProfileDto {
    id: string;
    email: string;
    fullName: string;
    info: string | null;
    role: ValidRoles[];
    verificationStatus: VerificationStatus;
    isActive: boolean;
    ratingAverage?: number;
    reviewsCount: number;
    createdAt: Date;
    updatedAt: Date;
    static fromEntity(user: User): UserProfileDto;
}
