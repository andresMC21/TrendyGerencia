import { User } from '../user/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { FavoriteResultDto, PaginatedProductsDto, ProductDetailDto, ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    findAll(query: FindProductsQueryDto): Promise<PaginatedProductsDto>;
    findOne(id: string): Promise<ProductDetailDto>;
    create(user: User, dto: CreateProductDto): Promise<ProductDto>;
    update(id: string, user: User, dto: UpdateProductDto): Promise<ProductDto>;
    remove(id: string, user: User): Promise<void>;
    toggleFavorite(id: string, user: User): Promise<FavoriteResultDto>;
}
