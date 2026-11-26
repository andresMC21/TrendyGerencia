import { MigrationInterface, QueryRunner } from 'typeorm';

/** TRD-25 · Avatar de objeto elegido por la persona (opcional). */
export class AddUserAvatar1794500000000 implements MigrationInterface {
  name = 'AddUserAvatar1794500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "avatar" character varying(40)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatar"`);
  }
}
