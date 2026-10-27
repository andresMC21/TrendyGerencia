import { ChangeEmailDto } from './dto/changeEmail.dto';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { LoginResponseDto, MessageResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { LoginUserDto } from './dto/login.dto';
import { UserProfileDto } from './dto/profile.dto';
import { RegisterUserDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    register(dto: RegisterUserDto): Promise<RegisterResponseDto>;
    login(dto: LoginUserDto): Promise<LoginResponseDto>;
    logout(user: User): Promise<MessageResponseDto>;
    findMe(user: User): UserProfileDto;
    updateMe(user: User, dto: UpdateUserDto): Promise<UserProfileDto>;
    changePassword(user: User, dto: ChangePasswordDto): Promise<MessageResponseDto>;
    changeEmail(user: User, dto: ChangeEmailDto): Promise<UserProfileDto>;
    requestVerification(user: User): Promise<UserProfileDto>;
    findOne(id: string): Promise<UserProfileDto>;
}
