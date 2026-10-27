import { ProductCondition } from '../enums/product-condition.enum';
import { ProductSort } from '../enums/product-sort.enum';
export declare class FindProductsQueryDto {
    neighborhood?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
    condition?: ProductCondition;
    sort?: ProductSort;
    page?: number;
    limit?: number;
}
