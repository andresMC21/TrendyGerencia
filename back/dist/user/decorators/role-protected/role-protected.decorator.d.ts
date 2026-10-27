import { ValidRoles } from '../../enums/valid-roles.enum';
export declare const META_ROLES = "roles";
export declare const RoleProtected: (...args: ValidRoles[]) => import("@nestjs/common", { with: { "resolution-mode": "import" } }).CustomDecorator<string>;
