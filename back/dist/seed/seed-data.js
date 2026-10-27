"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedReviews = exports.seedTransactions = exports.seedProducts = exports.seedUsers = void 0;
const product_condition_enum_1 = require("../product/enums/product-condition.enum");
const product_status_enum_1 = require("../product/enums/product-status.enum");
const valid_roles_enum_1 = require("../user/enums/valid-roles.enum");
const verification_status_1 = require("../user/enums/verification-status");
const transaction_status_enum_1 = require("../transaction/enums/transaction-status.enum");
exports.seedUsers = [
    {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'admin@trendy.local',
        password: 'Admin1234',
        fullName: 'Admin Trendy',
        info: 'Cuenta administradora inicial',
        verificationStatus: verification_status_1.VerificationStatus.VERIFIED,
        role: [valid_roles_enum_1.ValidRoles.ADMIN],
    },
    {
        id: '22222222-2222-4222-8222-222222222222',
        email: 'moderador@trendy.local',
        password: 'Mod12345',
        fullName: 'Moderador Trendy',
        info: 'Apoya la revision de perfiles y publicaciones',
        verificationStatus: verification_status_1.VerificationStatus.VERIFIED,
        role: [valid_roles_enum_1.ValidRoles.MODERATOR],
    },
    {
        id: '33333333-3333-4333-8333-333333333333',
        email: 'ana@trendy.local',
        password: 'Ana12345',
        fullName: 'Ana Gomez',
        info: 'Vende productos de segunda mano en Granada',
        verificationStatus: verification_status_1.VerificationStatus.VERIFIED,
        role: [valid_roles_enum_1.ValidRoles.USER],
    },
    {
        id: '44444444-4444-4444-8444-444444444444',
        email: 'carlos@trendy.local',
        password: 'Carlos12',
        fullName: 'Carlos Ruiz',
        info: 'Busca trueques y donaciones cerca de casa',
        verificationStatus: verification_status_1.VerificationStatus.UNVERIFIED,
        role: [valid_roles_enum_1.ValidRoles.USER],
    },
];
exports.seedProducts = [
    {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        sellerId: exports.seedUsers[2].id,
        title: 'Bicicleta urbana restaurada',
        description: 'Marco liviano, frenos revisados y llantas en buen estado.',
        price: 380000,
        acceptsBarter: true,
        category: 'deportes',
        condition: product_condition_enum_1.ProductCondition.USED,
        status: product_status_enum_1.ProductStatus.AVAILABLE,
        location: { lat: 3.4516, lng: -76.532 },
        neighborhoodId: 'granada',
        estimatedWeightKg: 12,
    },
    {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        sellerId: exports.seedUsers[2].id,
        title: 'Set de libros de programacion',
        description: 'Coleccion introductoria de JavaScript, redes y bases de datos.',
        price: 0,
        acceptsBarter: true,
        category: 'libros',
        condition: product_condition_enum_1.ProductCondition.USED,
        status: product_status_enum_1.ProductStatus.SOLD,
        location: { lat: 3.4567, lng: -76.5312 },
        neighborhoodId: 'granada',
        estimatedWeightKg: 5,
    },
    {
        id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        sellerId: exports.seedUsers[3].id,
        title: 'Silla ergonomica',
        description: 'Silla de oficina con soporte lumbar y altura ajustable.',
        price: 220000,
        acceptsBarter: false,
        category: 'hogar',
        condition: product_condition_enum_1.ProductCondition.LIKE_NEW,
        status: product_status_enum_1.ProductStatus.AVAILABLE,
        location: { lat: 3.4695, lng: -76.5225 },
        neighborhoodId: 'san-fernando',
        estimatedWeightKg: 9,
    },
];
exports.seedTransactions = [
    {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        productId: exports.seedProducts[1].id,
        buyerId: exports.seedUsers[3].id,
        sellerId: exports.seedUsers[2].id,
        status: transaction_status_enum_1.TransactionStatus.COMPLETED,
        safePointId: 'cai-granada',
        scheduledTime: '2026-10-15T20:00:00.000Z',
    },
];
exports.seedReviews = [
    {
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        transactionId: exports.seedTransactions[0].id,
        reviewerId: exports.seedUsers[3].id,
        targetUserId: exports.seedUsers[2].id,
        rating: 5,
        comment: 'Comunicacion clara y producto tal como estaba publicado.',
    },
];
//# sourceMappingURL=seed-data.js.map