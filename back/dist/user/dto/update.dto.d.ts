import { RegisterUserDto } from './register.dto';
declare const UpdateUserDto_base: import("@nestjs/common", { with: { "resolution-mode": "import" } }).Type<Partial<Pick<RegisterUserDto, "fullName">>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    info?: string;
}
export {};
