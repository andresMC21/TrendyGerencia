"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProductService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const geo_interface_1 = require("./interfaces/geo.interface");
const valid_roles_enum_1 = require("../user/enums/valid-roles.enum");
const product_dto_1 = require("./dto/product.dto");
const product_entity_1 = require("./entities/product.entity");
const product_sort_enum_1 = require("./enums/product-sort.enum");
const product_status_enum_1 = require("./enums/product-status.enum");
const ALLOWED_STATUS_TRANSITIONS = {
    [product_status_enum_1.ProductStatus.AVAILABLE]: [
        product_status_enum_1.ProductStatus.RESERVED,
        product_status_enum_1.ProductStatus.SOLD,
        product_status_enum_1.ProductStatus.REMOVED,
    ],
    [product_status_enum_1.ProductStatus.RESERVED]: [product_status_enum_1.ProductStatus.AVAILABLE, product_status_enum_1.ProductStatus.SOLD],
    [product_status_enum_1.ProductStatus.SOLD]: [],
    [product_status_enum_1.ProductStatus.REMOVED]: [],
};
const MAX_CACHE_ENTRIES = 500;
let ProductService = ProductService_1 = class ProductService {
    productRepository;
    logger = new common_1.Logger(ProductService_1.name);
    feedCache = new Map();
    feedCacheTtlMs;
    constructor(productRepository, config) {
        this.productRepository = productRepository;
        this.feedCacheTtlMs =
            Number(config.get('FEED_CACHE_TTL_SECONDS') ?? 30) * 1000;
    }
    async findAll(query) {
        const { neighborhood, lat, lng, radius = 5, category, condition, sort = product_sort_enum_1.ProductSort.RECENT, page = 1, limit = 20, } = query;
        if ((lat === undefined) !== (lng === undefined)) {
            throw new common_1.BadRequestException('lat y lng deben enviarse juntos');
        }
        const hasGeo = lat !== undefined && lng !== undefined;
        if (sort === product_sort_enum_1.ProductSort.DISTANCE && !hasGeo) {
            throw new common_1.BadRequestException('sort=distance requiere lat y lng');
        }
        const cacheKey = this.buildFeedCacheKey(query);
        const cached = this.feedCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now())
            return cached.value;
        const qb = this.productRepository
            .createQueryBuilder('product')
            .where('product.status = :status', { status: product_status_enum_1.ProductStatus.AVAILABLE });
        if (neighborhood) {
            qb.andWhere('product.neighborhoodId = :neighborhood', { neighborhood });
        }
        if (category) {
            qb.andWhere('LOWER(product.category) = LOWER(:category)', { category });
        }
        if (condition) {
            qb.andWhere('product.condition = :condition', { condition });
        }
        const point = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
        if (hasGeo) {
            qb.andWhere(`ST_DWithin(product.location, ${point}, :meters)`, {
                lng,
                lat,
                meters: radius * 1000,
            });
        }
        const total = await qb.getCount();
        if (hasGeo) {
            qb.addSelect(`ST_Distance(product.location, ${point})`, 'distance');
        }
        this.applySort(qb, sort);
        const { entities, raw } = await qb
            .offset((page - 1) * limit)
            .limit(limit)
            .getRawAndEntities();
        const counts = await this.countFavorites(entities.map((p) => p.id));
        const items = entities.map((product, i) => product_dto_1.ProductDto.fromEntity(product, {
            favoritesCount: counts.get(product.id) ?? 0,
            distanceKm: hasGeo
                ? Math.round((Number(raw[i].distance) / 1000) * 100) / 100
                : undefined,
        }));
        const result = { items, total, page, limit };
        this.storeInCache(cacheKey, result);
        return result;
    }
    async findOne(id) {
        const product = await this.productRepository
            .createQueryBuilder('product')
            .leftJoin('product.seller', 'seller')
            .addSelect([
            'seller.id',
            'seller.fullName',
            'seller.ratingAverage',
            'seller.reviewsCount',
        ])
            .where('product.id = :id', { id })
            .getOne();
        if (!product || product.status === product_status_enum_1.ProductStatus.REMOVED) {
            throw new common_1.NotFoundException(`Product with id ${id} not found`);
        }
        await this.productRepository.increment({ id }, 'viewsCount', 1);
        product.viewsCount += 1;
        const counts = await this.countFavorites([id]);
        const dto = product_dto_1.ProductDto.fromEntity(product, {
            favoritesCount: counts.get(id) ?? 0,
        });
        dto.seller = {
            id: product.seller.id,
            fullName: product.seller.fullName,
            ratingAverage: product.seller.ratingAverage ?? 0,
            reviewsCount: product.seller.reviewsCount ?? 0,
        };
        return dto;
    }
    async findById(id) {
        const product = await this.productRepository.findOneBy({ id });
        if (!product)
            throw new common_1.NotFoundException(`Product with id ${id} not found`);
        return product;
    }
    async findNearby(location, radiusKm, limit = 50) {
        const point = 'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography';
        return this.productRepository
            .createQueryBuilder('product')
            .where('product.status = :status', { status: product_status_enum_1.ProductStatus.AVAILABLE })
            .andWhere(`ST_DWithin(product.location, ${point}, :meters)`, {
            lng: location.lng,
            lat: location.lat,
            meters: radiusKm * 1000,
        })
            .orderBy(`ST_Distance(product.location, ${point})`, 'ASC')
            .limit(limit)
            .getMany();
    }
    async create(sellerId, dto) {
        const { location, ...rest } = dto;
        const product = this.productRepository.create({
            ...rest,
            price: dto.price ?? 0,
            acceptsBarter: dto.acceptsBarter ?? false,
            estimatedWeightKg: dto.estimatedWeightKg ?? null,
            sellerId,
            status: product_status_enum_1.ProductStatus.AVAILABLE,
            location: (0, geo_interface_1.toGeoJson)(location),
        });
        const saved = await this.productRepository.save(product);
        await this.invalidateFeedCache(saved.neighborhoodId);
        return product_dto_1.ProductDto.fromEntity(saved);
    }
    async update(id, userId, dto) {
        const product = await this.getActive(id);
        this.assertOwnership(product, userId);
        if (product.status !== product_status_enum_1.ProductStatus.AVAILABLE) {
            throw new common_1.ConflictException(`No se puede editar un producto en estado ${product.status}`);
        }
        const previousNeighborhood = product.neighborhoodId;
        const { location, ...rest } = dto;
        Object.assign(product, rest);
        if (location)
            product.location = (0, geo_interface_1.toGeoJson)(location);
        const saved = await this.productRepository.save(product);
        await this.invalidateFeedCache(previousNeighborhood);
        if (saved.neighborhoodId !== previousNeighborhood) {
            await this.invalidateFeedCache(saved.neighborhoodId);
        }
        const counts = await this.countFavorites([id]);
        return product_dto_1.ProductDto.fromEntity(saved, { favoritesCount: counts.get(id) ?? 0 });
    }
    async remove(id, userId, roles = []) {
        const product = await this.productRepository.findOneBy({ id });
        if (!product || product.status === product_status_enum_1.ProductStatus.REMOVED) {
            throw new common_1.NotFoundException(`Product with id ${id} not found`);
        }
        if (!this.canModerate(roles))
            this.assertOwnership(product, userId);
        if (product.status !== product_status_enum_1.ProductStatus.AVAILABLE) {
            throw new common_1.ConflictException(`No se puede eliminar un producto en estado ${product.status}`);
        }
        await this.productRepository.update({ id }, { status: product_status_enum_1.ProductStatus.REMOVED });
        await this.invalidateFeedCache(product.neighborhoodId);
    }
    async toggleFavorite(id, userId) {
        const product = await this.productRepository.findOneBy({ id });
        if (!product || product.status === product_status_enum_1.ProductStatus.REMOVED) {
            throw new common_1.NotFoundException(`Product with id ${id} not found`);
        }
        const already = await this.productRepository
            .createQueryBuilder('product')
            .innerJoin('product.favoritedBy', 'fan', 'fan.id = :userId', { userId })
            .where('product.id = :id', { id })
            .getCount();
        const relation = this.productRepository
            .createQueryBuilder()
            .relation(product_entity_1.Product, 'favoritedBy')
            .of(id);
        if (already > 0) {
            await relation.remove(userId);
            return { isFavorite: false };
        }
        await relation.add(userId);
        return { isFavorite: true };
    }
    async updateStatus(id, status) {
        const product = await this.findById(id);
        if (product.status === status)
            return;
        if (!ALLOWED_STATUS_TRANSITIONS[product.status].includes(status)) {
            throw new common_1.ConflictException(`Transición de estado inválida: ${product.status} → ${status}`);
        }
        await this.productRepository.update({ id }, { status });
        await this.invalidateFeedCache(product.neighborhoodId);
    }
    assertOwnership(product, userId) {
        if (product.sellerId !== userId) {
            throw new common_1.ForbiddenException('Solo el vendedor puede modificar este producto');
        }
    }
    canModerate(roles) {
        return roles.includes(valid_roles_enum_1.ValidRoles.ADMIN) || roles.includes(valid_roles_enum_1.ValidRoles.MODERATOR);
    }
    buildFeedCacheKey(query) {
        const q = {
            lat: query.lat ?? null,
            lng: query.lng ?? null,
            radius: query.radius ?? 5,
            category: query.category?.toLowerCase() ?? null,
            condition: query.condition ?? null,
            sort: query.sort ?? product_sort_enum_1.ProductSort.RECENT,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
        };
        return `feed:${query.neighborhood ?? 'all'}:${JSON.stringify(q)}`;
    }
    async invalidateFeedCache(neighborhoodId) {
        for (const key of this.feedCache.keys()) {
            if (key.startsWith(`feed:${neighborhoodId}:`) || key.startsWith('feed:all:')) {
                this.feedCache.delete(key);
            }
        }
    }
    storeInCache(key, value) {
        if (this.feedCacheTtlMs <= 0)
            return;
        if (this.feedCache.size >= MAX_CACHE_ENTRIES) {
            const oldest = this.feedCache.keys().next().value;
            if (oldest !== undefined)
                this.feedCache.delete(oldest);
        }
        this.feedCache.set(key, { value, expiresAt: Date.now() + this.feedCacheTtlMs });
    }
    applySort(qb, sort) {
        switch (sort) {
            case product_sort_enum_1.ProductSort.PRICE_ASC:
                qb.orderBy('product.price', 'ASC');
                break;
            case product_sort_enum_1.ProductSort.PRICE_DESC:
                qb.orderBy('product.price', 'DESC');
                break;
            case product_sort_enum_1.ProductSort.POPULAR:
                qb.orderBy('product.viewsCount', 'DESC');
                break;
            case product_sort_enum_1.ProductSort.DISTANCE:
                qb.orderBy('distance', 'ASC');
                break;
            default:
                qb.orderBy('product.createdAt', 'DESC');
        }
        qb.addOrderBy('product.id', 'ASC');
    }
    async getActive(id) {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product || product.status === product_status_enum_1.ProductStatus.REMOVED) {
            throw new common_1.NotFoundException(`Product with id ${id} not found`);
        }
        return product;
    }
    async countFavorites(ids) {
        const result = new Map();
        if (ids.length === 0)
            return result;
        const rows = await this.productRepository
            .createQueryBuilder('product')
            .select('product.id', 'id')
            .addSelect('COUNT(fan.id)', 'count')
            .leftJoin('product.favoritedBy', 'fan')
            .where('product.id IN (:...ids)', { ids })
            .groupBy('product.id')
            .getRawMany();
        for (const row of rows)
            result.set(row.id, Number(row.count));
        return result;
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = ProductService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], ProductService);
//# sourceMappingURL=product.service.js.map