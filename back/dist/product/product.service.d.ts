import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { GeoPoint } from './interfaces/geo.interface';
import { PaginatedResult } from './interfaces/paginated-result.interface';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { ProductDetailDto, ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductStatus } from './enums/product-status.enum';
export declare class ProductService {
    private readonly productRepository;
    private readonly logger;
    private readonly feedCache;
    private readonly feedCacheTtlMs;
    constructor(productRepository: Repository<Product>, config: ConfigService);
    findAll(query: FindProductsQueryDto): Promise<PaginatedResult<ProductDto>>;
    findOne(id: string): Promise<ProductDetailDto>;
    findById(id: string): Promise<Product>;
    findNearby(location: GeoPoint, radiusKm: number, limit?: number): Promise<Product[]>;
    create(sellerId: string, dto: CreateProductDto): Promise<ProductDto>;
    update(id: string, userId: string, dto: UpdateProductDto): Promise<ProductDto>;
    remove(id: string, userId: string, roles?: ValidRoles[]): Promise<void>;
    toggleFavorite(id: string, userId: string): Promise<{
        isFavorite: boolean;
    }>;
    updateStatus(id: string, status: ProductStatus): Promise<void>;
    assertOwnership(product: Product, userId: string): void;
    private canModerate;
    buildFeedCacheKey(query: FindProductsQueryDto): string;
    invalidateFeedCache(neighborhoodId: string): Promise<void>;
    private storeInCache;
    private applySort;
    private getActive;
    private countFavorites;
}
