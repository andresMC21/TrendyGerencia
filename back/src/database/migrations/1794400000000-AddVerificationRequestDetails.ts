import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * HU-19 · Resolver verificaciones: la solicitud necesita datos propios.
 *
 * - verificationRequestedAt: cuándo se pidió la verificación (antes se usaba
 *   updatedAt, que cambia con cualquier edición del perfil).
 * - verificationRejectionReason: motivo del último rechazo, que la persona ve
 *   en su perfil para saber qué corregir.
 *
 * Las solicitudes que ya estaban PENDING toman updatedAt como fecha.
 */
export class AddVerificationRequestDetails1794400000000
  implements MigrationInterface
{
  name = 'AddVerificationRequestDetails1794400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "verificationRequestedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "verificationRejectionReason" character varying(300)`,
    );
    await queryRunner.query(
      `UPDATE "user" SET "verificationRequestedAt" = "updatedAt" WHERE "verificationStatus" = 'PENDING'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "verificationRejectionReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "verificationRequestedAt"`,
    );
  }
}
