import { MigrationInterface, QueryRunner } from 'typeorm';

/** TRD-25 · Chat entre comprador y vendedor de cada transacción. */
export class TransactionMessages1794500000000 implements MigrationInterface {
  name = 'TransactionMessages1794500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transaction_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transactionId" uuid NOT NULL, "senderId" uuid NOT NULL, "body" character varying(500) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_transaction_message_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transaction_message_transactionId" ON "transaction_message" ("transactionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_message" ADD CONSTRAINT "FK_transaction_message_transaction" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_message" ADD CONSTRAINT "FK_transaction_message_sender" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_message" DROP CONSTRAINT "FK_transaction_message_sender"`);
    await queryRunner.query(`ALTER TABLE "transaction_message" DROP CONSTRAINT "FK_transaction_message_transaction"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transaction_message_transactionId"`);
    await queryRunner.query(`DROP TABLE "transaction_message"`);
  }
}
