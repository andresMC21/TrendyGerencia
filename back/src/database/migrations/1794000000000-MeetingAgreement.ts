import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * HU-16 · Acordar una entrega entre comprador y vendedor.
 *
 * Antes, quien registraba el punto lo dejaba acordado de inmediato. Ahora una
 * persona propone (proposedById) y la otra acepta (agreedAt). Las transacciones
 * que ya estaban acordadas conservan su acuerdo con la fecha de su última
 * actualización.
 */
export class MeetingAgreement1794000000000 implements MigrationInterface {
  name = 'MeetingAgreement1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "proposedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "agreedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_transaction_proposed_by" FOREIGN KEY ("proposedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `UPDATE "transaction" SET "agreedAt" = "updatedAt"
        WHERE "safePointId" IS NOT NULL AND "status" IN ('AGREED_POINT', 'COMPLETED')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_transaction_proposed_by"`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "agreedAt"`);
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "proposedById"`,
    );
  }
}
