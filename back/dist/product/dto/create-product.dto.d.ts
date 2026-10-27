import { ProductCondition } from '../enums/product-condition.enum';
import { GeoPointDto } from './geo-point.dto';
export declare class CreateProductDto {
    title: string;
    description: string;
    price?: number;
    acceptsBarter?: boolean;
    category: string;
    condition: ProductCondition;
    location: GeoPointDto;
    neighborhoodId: string;
    estimatedWeightKg?: number;
}
