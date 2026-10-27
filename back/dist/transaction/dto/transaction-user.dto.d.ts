import { User } from '../../user/entities/user.entity';
export declare class TransactionUserDto {
    id: string;
    fullName: string;
    static fromEntity(user?: User): TransactionUserDto | undefined;
}
