import { VerificationStatus } from '../enums/verification-status';
import { ValidRoles } from '../enums/valid-roles.enum';
export declare class User {
    id: string;
    email: string;
    password?: string;
    fullName: string;
    tokenVersion: number;
    info: string | null;
    verificationStatus: VerificationStatus;
    ratingAverage?: number;
    reviewsCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    role: ValidRoles[];
    checkEmailBeforeChanges(): void;
}
