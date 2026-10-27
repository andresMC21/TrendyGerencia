import type { GeoJsonPoint } from '../interfaces/geo.interface';
import { User } from '../../user/entities/user.entity';
import { ProductCondition } from '../enums/product-condition.enum';
import { ProductStatus } from '../enums/product-status.enum';
export declare class Product {
    id: string;
    sellerId: string;
    seller: User;
    title: string;
    description: string;
    price: number;
    acceptsBarter: boolean;
    category: string;
    condition: ProductCondition;
    status: ProductStatus;
    location: GeoJsonPoint;
    neighborhoodId: string;
    estimatedWeightKg: number | null;
    favoritedBy: User[];
    viewsCount: number;
    createdAt: Date;
    updatedAt: Date;
}
