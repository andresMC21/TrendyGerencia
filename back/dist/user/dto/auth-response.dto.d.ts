import { UserProfileDto } from './profile.dto';
export declare class LoginResponseDto {
    id: string;
    email: string;
    token: string;
}
export declare class RegisterResponseDto extends UserProfileDto {
    token: string;
}
export declare class MessageResponseDto {
    message: string;
}
