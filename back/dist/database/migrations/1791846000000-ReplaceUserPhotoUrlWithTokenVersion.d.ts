import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ReplaceUserPhotoUrlWithTokenVersion1791846000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
