import { ProductCondition } from '../product/enums/product-condition.enum';
import { ProductStatus } from '../product/enums/product-status.enum';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { VerificationStatus } from '../user/enums/verification-status';
import { TransactionStatus } from '../transaction/enums/transaction-status.enum';
export declare const seedUsers: readonly [{
    readonly id: "11111111-1111-4111-8111-111111111111";
    readonly email: "admin@trendy.local";
    readonly password: "Admin1234";
    readonly fullName: "Admin Trendy";
    readonly info: "Cuenta administradora inicial";
    readonly verificationStatus: VerificationStatus.VERIFIED;
    readonly role: readonly [ValidRoles.ADMIN];
}, {
    readonly id: "22222222-2222-4222-8222-222222222222";
    readonly email: "moderador@trendy.local";
    readonly password: "Mod12345";
    readonly fullName: "Moderador Trendy";
    readonly info: "Apoya la revision de perfiles y publicaciones";
    readonly verificationStatus: VerificationStatus.VERIFIED;
    readonly role: readonly [ValidRoles.MODERATOR];
}, {
    readonly id: "33333333-3333-4333-8333-333333333333";
    readonly email: "ana@trendy.local";
    readonly password: "Ana12345";
    readonly fullName: "Ana Gomez";
    readonly info: "Vende productos de segunda mano en Granada";
    readonly verificationStatus: VerificationStatus.VERIFIED;
    readonly role: readonly [ValidRoles.USER];
}, {
    readonly id: "44444444-4444-4444-8444-444444444444";
    readonly email: "carlos@trendy.local";
    readonly password: "Carlos12";
    readonly fullName: "Carlos Ruiz";
    readonly info: "Busca trueques y donaciones cerca de casa";
    readonly verificationStatus: VerificationStatus.UNVERIFIED;
    readonly role: readonly [ValidRoles.USER];
}];
export declare const seedProducts: readonly [{
    readonly id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    readonly sellerId: "33333333-3333-4333-8333-333333333333";
    readonly title: "Bicicleta urbana restaurada";
    readonly description: "Marco liviano, frenos revisados y llantas en buen estado.";
    readonly price: 380000;
    readonly acceptsBarter: true;
    readonly category: "deportes";
    readonly condition: ProductCondition.USED;
    readonly status: ProductStatus.AVAILABLE;
    readonly location: {
        readonly lat: 3.4516;
        readonly lng: -76.532;
    };
    readonly neighborhoodId: "granada";
    readonly estimatedWeightKg: 12;
}, {
    readonly id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    readonly sellerId: "33333333-3333-4333-8333-333333333333";
    readonly title: "Set de libros de programacion";
    readonly description: "Coleccion introductoria de JavaScript, redes y bases de datos.";
    readonly price: 0;
    readonly acceptsBarter: true;
    readonly category: "libros";
    readonly condition: ProductCondition.USED;
    readonly status: ProductStatus.SOLD;
    readonly location: {
        readonly lat: 3.4567;
        readonly lng: -76.5312;
    };
    readonly neighborhoodId: "granada";
    readonly estimatedWeightKg: 5;
}, {
    readonly id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    readonly sellerId: "44444444-4444-4444-8444-444444444444";
    readonly title: "Silla ergonomica";
    readonly description: "Silla de oficina con soporte lumbar y altura ajustable.";
    readonly price: 220000;
    readonly acceptsBarter: false;
    readonly category: "hogar";
    readonly condition: ProductCondition.LIKE_NEW;
    readonly status: ProductStatus.AVAILABLE;
    readonly location: {
        readonly lat: 3.4695;
        readonly lng: -76.5225;
    };
    readonly neighborhoodId: "san-fernando";
    readonly estimatedWeightKg: 9;
}];
export declare const seedTransactions: readonly [{
    readonly id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    readonly productId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    readonly buyerId: "44444444-4444-4444-8444-444444444444";
    readonly sellerId: "33333333-3333-4333-8333-333333333333";
    readonly status: TransactionStatus.COMPLETED;
    readonly safePointId: "cai-granada";
    readonly scheduledTime: "2026-10-15T20:00:00.000Z";
}];
export declare const seedReviews: readonly [{
    readonly id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    readonly transactionId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    readonly reviewerId: "44444444-4444-4444-8444-444444444444";
    readonly targetUserId: "33333333-3333-4333-8333-333333333333";
    readonly rating: 5;
    readonly comment: "Comunicacion clara y producto tal como estaba publicado.";
}];
