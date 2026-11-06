import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * HU-16 · Avisar a quien propuso que su propuesta fue rechazada.
 *
 * Al rechazar se borraba la propuesta sin dejar rastro, así que quien la hizo
 * no se enteraba. Ahora se guarda quién la rechazó, cuándo y qué punto y
 * horario se rechazaron, hasta que llegue una propuesta nueva.
 */
export class MeetingRejection1794100000000 implements MigrationInterface {
  name = 'MeetingRejection1794100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "rejectedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "rejectedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "rejectedSafePointId" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "rejectedScheduledTime" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_transaction_rejected_by" FOREIGN KEY ("rejectedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_transaction_rejected_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "rejectedScheduledTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "rejectedSafePointId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "rejectedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "rejectedById"`,
    );
  }
}
