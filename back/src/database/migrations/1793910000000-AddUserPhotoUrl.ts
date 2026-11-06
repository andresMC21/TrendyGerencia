import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * HU-03 · Consultar mi perfil: el perfil debe incluir la foto.
 *
 * La migración ReplaceUserPhotoUrlWithTokenVersion eliminó la columna
 * photoUrl al agregar tokenVersion (cierre de sesión). Esta la vuelve a crear,
 * opcional (null mientras la persona no tenga foto).
 */
export class AddUserPhotoUrl1793910000000 implements MigrationInterface {
  name = 'AddUserPhotoUrl1793910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "photoUrl" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photoUrl"`);
  }
}
