import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
type UploadedProductImage = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};
export declare class ProductService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, search?: string, categoryId?: string): Promise<({
        category: {
            id: string;
            name: string;
            color: string | null;
        } | null;
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        description: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        category: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        } | null;
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        description: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
    create(dto: CreateProductDto, tenantId: string): Promise<{
        category: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        } | null;
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        description: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
    update(id: string, dto: UpdateProductDto, tenantId: string): Promise<{
        category: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        } | null;
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        description: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        description: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
    uploadImage(id: string, tenantId: string, file: UploadedProductImage): Promise<{
        category: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string | null;
        } | null;
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        sku: string;
        barcode: string | null;
        description: string | null;
        purchasePrice: number;
        sellingPrice: number;
        stock: number;
        minStock: number;
        image: string | null;
        categoryId: string | null;
    }>;
}
export {};
