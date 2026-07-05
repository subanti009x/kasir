import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    findAll(user: any, search?: string, categoryId?: string): Promise<({
        category: {
            id: string;
            name: string;
            color: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        barcode: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        category: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        barcode: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
    create(dto: CreateProductDto, user: any): Promise<{
        category: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        barcode: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
    update(id: string, dto: UpdateProductDto, user: any): Promise<{
        category: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        barcode: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
        name: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        sku: string;
        barcode: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
}
