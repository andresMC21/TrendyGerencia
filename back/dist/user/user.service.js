"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const typeorm_2 = require("typeorm");
const profile_dto_1 = require("./dto/profile.dto");
const user_entity_1 = require("./entities/user.entity");
const valid_roles_enum_1 = require("./enums/valid-roles.enum");
const verification_status_1 = require("./enums/verification-status");
const BCRYPT_ROUNDS = 10;
const NAME_LOCKED_STATUSES = [
    verification_status_1.VerificationStatus.VERIFIED,
    verification_status_1.VerificationStatus.PENDING,
];
let UserService = class UserService {
    userRepository;
    jwtService;
    logger = new common_1.Logger('UserService');
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    async create(registerDto) {
        const { password, ...userDetails } = registerDto;
        try {
            const user = this.userRepository.create({
                ...userDetails,
                password: await this.encryptPassword(password),
            });
            await this.userRepository.save(user);
            const { password: _, ...safeUser } = user;
            return {
                ...safeUser,
                token: this.getJwtToken({
                    id: user.id,
                    email: user.email,
                    tokenVersion: user.tokenVersion,
                }),
            };
        }
        catch (error) {
            this.handleException(error);
        }
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email },
            select: { id: true, email: true, password: true, isActive: true },
        });
        const passwordMatches = user?.password
            ? await bcrypt_1.default.compare(password, user.password)
            : false;
        if (!user || !user.isActive || !passwordMatches) {
            throw new common_1.UnauthorizedException('Email or password incorrect');
        }
        return {
            id: user.id,
            email: user.email,
            token: this.getJwtToken({
                id: user.id,
                email: user.email,
                tokenVersion: user.tokenVersion
            }),
        };
    }
    async logout(user) {
        await this.userRepository.increment({ id: user.id }, 'tokenVersion', 1);
        return { message: 'Session successfuly closed' };
    }
    findMe(user) {
        return this.toProfile(user);
    }
    async updateMe(user, updateUserDto) {
        const changesName = updateUserDto.fullName !== undefined &&
            updateUserDto.fullName !== user.fullName;
        if (changesName && NAME_LOCKED_STATUSES.includes(user.verificationStatus)) {
            throw new common_1.ForbiddenException('The name cannot be changed while the identity is verified or under review');
        }
        const userToUpdate = await this.preloadUser(user.id, updateUserDto);
        if (!userToUpdate) {
            throw new common_1.NotFoundException(`User with id ${user.id} not found`);
        }
        try {
            await this.userRepository.save(userToUpdate);
            return this.toProfile(userToUpdate);
        }
        catch (error) {
            this.handleException(error);
        }
    }
    async changePassword(user, dto) {
        const { currentPassword, newPassword } = dto;
        await this.assertCurrentPassword(user.id, currentPassword);
        if (currentPassword === newPassword) {
            throw new common_1.BadRequestException('The new password must be different from the current one');
        }
        try {
            await this.userRepository.update(user.id, {
                password: await this.encryptPassword(newPassword),
            });
        }
        catch (error) {
            this.handleException(error);
        }
        return { message: 'Password updated successfully' };
    }
    async changeEmail(user, dto) {
        const newEmail = dto.newEmail.toLowerCase().trim();
        await this.assertCurrentPassword(user.id, dto.currentPassword);
        if (newEmail === user.email) {
            throw new common_1.BadRequestException('The new email must be different from the current one');
        }
        try {
            await this.userRepository.update(user.id, { email: newEmail });
        }
        catch (error) {
            this.handleException(error, 'Email is already in use');
        }
        return this.toProfile(await this.getUserOrFail(user.id));
    }
    async requestVerification(user) {
        if (user.verificationStatus === verification_status_1.VerificationStatus.VERIFIED ||
            user.verificationStatus === verification_status_1.VerificationStatus.PENDING) {
            throw new common_1.ConflictException('The identity is already verified or under review');
        }
        const userToUpdate = await this.preloadUser(user.id, {
            verificationStatus: verification_status_1.VerificationStatus.PENDING,
        });
        if (!userToUpdate) {
            throw new common_1.NotFoundException(`User with id ${user.id} not found`);
        }
        try {
            await this.userRepository.save(userToUpdate);
            return this.toProfile(userToUpdate);
        }
        catch (error) {
            this.handleException(error);
        }
    }
    async findPublicProfile(id) {
        const user = await this.userRepository.findOneBy({ id, isActive: true });
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        return this.toProfile(user);
    }
    async findProfile(searchDto) {
        try {
            if (typeof searchDto.email === 'string') {
                const user = await this.userRepository.findOneBy({
                    email: searchDto.email.toLowerCase().trim(),
                });
                if (user) {
                    return this.toProfile(user);
                }
            }
            if (typeof searchDto.fullName === 'string') {
                const user = await this.userRepository.findOneBy({
                    fullName: searchDto.fullName,
                });
                if (user) {
                    return this.toProfile(user);
                }
            }
            return undefined;
        }
        catch (error) {
            this.handleException(error);
        }
    }
    findByEmail(email) {
        return this.userRepository.findOne({
            where: { email: email.toLowerCase().trim() },
            select: { email: true, password: true, id: true },
        });
    }
    async findAll(query, sort = { by: 'createdAt', direction: 'DESC' }) {
        const { limit, skip, role, isActive, verificationStatus, search } = query;
        const qb = this.userRepository
            .createQueryBuilder('user')
            .select([
            'user.id',
            'user.email',
            'user.fullName',
            'user.info',
            'user.role',
            'user.verificationStatus',
            'user.isActive',
            'user.ratingAverage',
            'user.reviewsCount',
            'user.createdAt',
            'user.updatedAt',
        ]);
        if (role) {
            qb.andWhere(':role = ANY(user.role)', { role });
        }
        if (isActive !== undefined) {
            qb.andWhere('user.isActive = :isActive', { isActive });
        }
        if (verificationStatus) {
            qb.andWhere('user.verificationStatus = :verificationStatus', {
                verificationStatus,
            });
        }
        if (search) {
            const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
            qb.andWhere('(user.email ILIKE :term OR user.fullName ILIKE :term)', {
                term,
            });
        }
        const [users, total] = await qb
            .orderBy(`user.${sort.by}`, sort.direction)
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return {
            data: users.map((user) => this.toProfile(user)),
            total,
            limit,
            skip,
        };
    }
    async findOneAdmin(id) {
        return this.toProfile(await this.getUserOrFail(id));
    }
    async adminUpdate(id, dto) {
        const userToUpdate = await this.preloadUser(id, dto);
        if (!userToUpdate) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        try {
            await this.userRepository.save(userToUpdate);
            return this.toProfile(userToUpdate);
        }
        catch (error) {
            this.handleException(error, 'Email is already in use');
        }
    }
    async changeRoles(admin, id, dto) {
        if (admin.id === id && !dto.roles.includes(valid_roles_enum_1.ValidRoles.ADMIN)) {
            throw new common_1.ForbiddenException('You cannot remove your own admin role');
        }
        const user = await this.getUserOrFail(id);
        user.role = dto.roles;
        try {
            await this.userRepository.save(user);
            return this.toProfile(user);
        }
        catch (error) {
            this.handleException(error);
        }
    }
    async setActiveStatus(admin, id, dto) {
        if (admin.id === id && !dto.isActive) {
            throw new common_1.ForbiddenException('You cannot deactivate your own account');
        }
        const user = await this.getUserOrFail(id);
        user.isActive = dto.isActive;
        try {
            await this.userRepository.save(user);
            return this.toProfile(user);
        }
        catch (error) {
            this.handleException(error);
        }
    }
    remove(admin, id) {
        return this.setActiveStatus(admin, id, { isActive: false });
    }
    findPendingVerifications(pagination) {
        return this.findAll({
            limit: pagination.limit,
            skip: pagination.skip,
            verificationStatus: verification_status_1.VerificationStatus.PENDING,
        }, { by: 'updatedAt', direction: 'ASC' });
    }
    async resolveVerification(moderator, userId, dto) {
        if (moderator.id === userId) {
            throw new common_1.ForbiddenException('You cannot review your own verification request');
        }
        const user = await this.getUserOrFail(userId);
        if (user.verificationStatus !== verification_status_1.VerificationStatus.PENDING) {
            throw new common_1.ConflictException('The user has no pending verification');
        }
        user.verificationStatus = dto.approved
            ? verification_status_1.VerificationStatus.VERIFIED
            : verification_status_1.VerificationStatus.REJECTED;
        try {
            await this.userRepository.save(user);
        }
        catch (error) {
            this.handleException(error);
        }
        this.logger.log(`Verification of user ${userId} ${user.verificationStatus} by ${moderator.id}` +
            (dto.reason ? ` - reason: ${dto.reason}` : ''));
        return this.toProfile(user);
    }
    async encryptPassword(password) {
        return bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
    }
    async assertCurrentPassword(userId, plainPassword) {
        const record = await this.userRepository.findOne({
            where: { id: userId },
            select: { id: true, password: true },
        });
        const matches = record?.password
            ? await bcrypt_1.default.compare(plainPassword, record.password)
            : false;
        if (!matches) {
            throw new common_1.ForbiddenException('Current password is incorrect');
        }
    }
    getJwtToken(jwtPayload) {
        return this.jwtService.sign(jwtPayload);
    }
    async getUserOrFail(id) {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }
    async preloadUser(userId, updateDto) {
        return this.userRepository.preload({
            id: userId,
            ...updateDto,
        });
    }
    toProfile(user) {
        return profile_dto_1.UserProfileDto.fromEntity(user);
    }
    handleException(error, conflictMessage = 'User is already registered. Try to login') {
        if (error instanceof common_1.HttpException) {
            throw error;
        }
        this.logger.error(error);
        if (this.isDatabaseError(error) && error.code === '23505') {
            throw new common_1.ConflictException(conflictMessage);
        }
        throw new common_1.InternalServerErrorException('Unexpected error, check server logs');
    }
    isDatabaseError(error) {
        return typeof error === 'object' && error !== null;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], UserService);
//# sourceMappingURL=user.service.js.map