import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * HU-17 · El intercambio se completa cuando confirman los dos.
 *
 * El vendedor marca «producto vendido» (sellerConfirmedAt) y el comprador
 * «producto recibido» (buyerConfirmedAt). Las transacciones que ya estaban
 * completadas quedan con ambas confirmaciones en la fecha de su última
 * actualización.
 */
export class ExchangeConfirmation1794200000000 implements MigrationInterface {
  name = 'ExchangeConfirmation1794200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "sellerConfirmedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "buyerConfirmedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `UPDATE "transaction"
          SET "sellerConfirmedAt" = "updatedAt", "buyerConfirmedAt" = "updatedAt"
        WHERE "status" = 'COMPLETED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "buyerConfirmedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP COLUMN "sellerConfirmedAt"`,
    );
  }
}
