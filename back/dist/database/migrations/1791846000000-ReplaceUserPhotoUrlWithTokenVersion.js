"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplaceUserPhotoUrlWithTokenVersion1791846000000 = void 0;
class ReplaceUserPhotoUrlWithTokenVersion1791846000000 {
    name = 'ReplaceUserPhotoUrlWithTokenVersion1791846000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "tokenVersion" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photoUrl"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "photoUrl" text`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tokenVersion"`);
    }
}
exports.ReplaceUserPhotoUrlWithTokenVersion1791846000000 = ReplaceUserPhotoUrlWithTokenVersion1791846000000;
//# sourceMappingURL=1791846000000-ReplaceUserPhotoUrlWithTokenVersion.js.map