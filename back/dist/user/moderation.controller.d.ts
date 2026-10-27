import { PaginationDto } from './dto/pagination.dto';
import { ResolveVerification } from './dto/verification.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { User } from './entities/user.entity';
import { UserProfileDto } from './dto/profile.dto';
import { UserService } from './user.service';
export declare class ModerationController {
    private readonly userService;
    constructor(userService: UserService);
    findPending(pagination: PaginationDto): Promise<PaginatedUsersDto>;
    resolve(moderator: User, userId: string, dto: ResolveVerification): Promise<UserProfileDto>;
}
