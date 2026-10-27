"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUser = void 0;
const common_1 = require("@nestjs/common");
exports.GetUser = (0, common_1.createParamDecorator)((_data, context) => {
    const { user } = context
        .switchToHttp()
        .getRequest();
    if (!user) {
        throw new common_1.InternalServerErrorException('User not found in request (is the route missing @Auth()?)');
    }
    return user;
});
//# sourceMappingURL=get-user.decorator.js.map