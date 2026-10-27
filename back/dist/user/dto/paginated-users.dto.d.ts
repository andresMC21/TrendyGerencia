import { UserProfileDto } from './profile.dto';
export declare class PaginatedUsersDto {
    data: UserProfileDto[];
    total: number;
    limit: number;
    skip: number;
}
