import { ValidRoles } from '../enums/valid-roles.enum';
import { VerificationStatus } from '../enums/verification-status';
import { PaginationDto } from './pagination.dto';
export declare class AdminUserQueryDto extends PaginationDto {
    role?: ValidRoles;
    isActive?: boolean;
    verificationStatus?: VerificationStatus;
    search?: string;
}
