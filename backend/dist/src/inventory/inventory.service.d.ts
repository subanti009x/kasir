import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryLogDto } from './dto/inventory.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, productId?: string): Promise<({
        product: {
            id: string;
            name: string;
            sku: string;
            stock: number;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        type: string;
        note: string | null;
        quantity: number;
        reference: string | null;
        productId: string;
    })[]>;
    create(dto: CreateInventoryLogDto, tenantId: string): Promise<{
        product: {
            id: string;
            name: string;
            sku: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        type: string;
        note: string | null;
        quantity: number;
        reference: string | null;
        productId: string;
    }>;
    getLowStock(tenantId: string): Promise<{
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
    }[]>;
    getLowStockProducts(tenantId: string): Promise<{
        id: string;
        name: string;
        category: {
            name: string;
        } | null;
        sku: string;
        stock: number;
        minStock: number;
    }[]>;
}
