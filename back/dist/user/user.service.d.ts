import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ChangeRole } from './dto/changeRole.dto';
import { ChangeEmailDto } from './dto/changeEmail.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { AdminUpdateUserDto } from './dto/adminUpdate.dto';
import { AdminUserQueryDto } from './dto/adminQuery.dto';
import { LoginUserDto } from './dto/login.dto';
import { PaginationDto } from './dto/pagination.dto';
import { UserProfileDto } from './dto/profile.dto';
import { RegisterUserDto } from './dto/register.dto';
import { SearchUserDto } from './dto/search.dto';
import { SetActiveStatus } from './dto/activeStatus.dto';
import { UpdateUserDto } from './dto/update.dto';
import { ResolveVerification } from './dto/verification.dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { VerificationStatus } from './enums/verification-status';
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    limit: number;
    skip: number;
}
type UserSort = {
    by: 'createdAt' | 'updatedAt';
    direction: 'ASC' | 'DESC';
};
export declare class UserService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly logger;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    create(registerDto: RegisterUserDto): Promise<{
        token: string;
        id: string;
        email: string;
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
    }>;
    login(loginDto: LoginUserDto): Promise<{
        id: string;
        email: string;
        token: string;
    }>;
    logout(user: User): Promise<{
        message: string;
    }>;
    findMe(user: User): UserProfileDto;
    updateMe(user: User, updateUserDto: UpdateUserDto): Promise<UserProfileDto>;
    changePassword(user: User, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    changeEmail(user: User, dto: ChangeEmailDto): Promise<UserProfileDto>;
    requestVerification(user: User): Promise<UserProfileDto>;
    findPublicProfile(id: string): Promise<UserProfileDto>;
    findProfile(searchDto: SearchUserDto): Promise<UserProfileDto | undefined>;
    findByEmail(email: string): Promise<User | null>;
    findAll(query: AdminUserQueryDto, sort?: UserSort): Promise<PaginatedResult<UserProfileDto>>;
    findOneAdmin(id: string): Promise<UserProfileDto>;
    adminUpdate(id: string, dto: AdminUpdateUserDto): Promise<UserProfileDto>;
    changeRoles(admin: User, id: string, dto: ChangeRole): Promise<UserProfileDto>;
    setActiveStatus(admin: User, id: string, dto: SetActiveStatus): Promise<UserProfileDto>;
    remove(admin: User, id: string): Promise<UserProfileDto>;
    findPendingVerifications(pagination: PaginationDto): Promise<PaginatedResult<UserProfileDto>>;
    resolveVerification(moderator: User, userId: string, dto: ResolveVerification): Promise<UserProfileDto>;
    private encryptPassword;
    private assertCurrentPassword;
    private getJwtToken;
    private getUserOrFail;
    private preloadUser;
    private toProfile;
    private handleException;
    private isDatabaseError;
}
export {};
