"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = Auth;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const user_role_guard_1 = require("../guards/user-role/user-role.guard");
const role_protected_decorator_1 = require("./role-protected/role-protected.decorator");
function Auth(...roles) {
    return (0, common_1.applyDecorators)((0, role_protected_decorator_1.RoleProtected)(...roles), (0, common_1.UseGuards)((0, passport_1.AuthGuard)(), user_role_guard_1.UserRoleGuard), (0, swagger_1.ApiBearerAuth)('JWT-auth'), (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Falta el JWT o es inválido' }), ...(roles.length
        ? [(0, swagger_1.ApiForbiddenResponse)({ description: `Requiere alguno de estos roles: ${roles.join(', ')}` })]
        : []));
}
//# sourceMappingURL=auth.decorator.js.map