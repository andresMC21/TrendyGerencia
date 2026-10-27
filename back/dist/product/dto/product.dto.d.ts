import { Product } from '../entities/product.entity';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { GeoPointDto } from './geo-point.dto';
export declare class ProductDto {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    acceptsBarter: boolean;
    category: string;
    condition: ProductCondition;
    status: ProductStatus;
    location: GeoPointDto;
    neighborhoodId: string;
    estimatedWeightKg: number | null;
    favoritesCount: number;
    viewsCount: number;
    distanceKm?: number;
    createdAt: Date;
    updatedAt: Date;
    static fromEntity(product: Product, extra?: {
        favoritesCount?: number;
        distanceKm?: number;
    }): ProductDto;
}
export declare class ProductSellerDto {
    id: string;
    fullName: string;
    ratingAverage: number;
    reviewsCount: number;
}
export declare class ProductDetailDto extends ProductDto {
    seller: ProductSellerDto;
}
export declare class PaginatedProductsDto {
    items: ProductDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class FavoriteResultDto {
    isFavorite: boolean;
}
