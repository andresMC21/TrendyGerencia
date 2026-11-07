import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductPhoto1794300000000 implements MigrationInterface {
  name = 'AddProductPhoto1794300000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "product" ADD "photoUrl" text');
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "product" DROP COLUMN "photoUrl"');
  }
}
