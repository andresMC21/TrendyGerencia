import { SetActiveStatus } from './dto/activeStatus.dto';
import { AdminUpdateUserDto } from './dto/adminUpdate.dto';
import { AdminUserQueryDto } from './dto/adminQuery.dto';
import { ChangeRole } from './dto/changeRole.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserProfileDto } from './dto/profile.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
export declare class AdminUserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(query: AdminUserQueryDto): Promise<PaginatedUsersDto>;
    findOne(id: string): Promise<UserProfileDto>;
    update(id: string, dto: AdminUpdateUserDto): Promise<UserProfileDto>;
    changeRoles(admin: User, id: string, dto: ChangeRole): Promise<UserProfileDto>;
    setActiveStatus(admin: User, id: string, dto: SetActiveStatus): Promise<UserProfileDto>;
    remove(admin: User, id: string): Promise<UserProfileDto>;
}
