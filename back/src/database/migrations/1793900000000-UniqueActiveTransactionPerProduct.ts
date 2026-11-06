import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * HU-15 · Una sola transacción activa (PENDING o AGREED_POINT) por producto.
 *
 * Antes de crear el índice, si ya existen productos con más de una transacción
 * activa (posible por la condición de carrera que tenía POST /transactions),
 * se conserva la más antigua y las demás se cancelan, para que la migración no
 * falle con datos existentes.
 */
export class UniqueActiveTransactionPerProduct1793900000000
  implements MigrationInterface
{
  name = 'UniqueActiveTransactionPerProduct1793900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "transaction" t
         SET "status" = 'CANCELLED', "updatedAt" = now()
        FROM (
          SELECT "id",
                 row_number() OVER (PARTITION BY "productId" ORDER BY "createdAt", "id") AS n
            FROM "transaction"
           WHERE "status" IN ('PENDING', 'AGREED_POINT')
        ) d
       WHERE t."id" = d."id" AND d.n > 1
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_transaction_active_product" ON "transaction" ("productId") WHERE "status" IN ('PENDING', 'AGREED_POINT')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_transaction_active_product"`);
  }
}
