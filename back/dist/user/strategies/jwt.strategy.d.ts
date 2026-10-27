import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export interface JwtPayload {
    id: string;
    tokenVersion: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userRepository;
    constructor(userRepository: Repository<User>, configService: ConfigService);
    validate(payload: JwtPayload): Promise<User>;
}
export {};
