import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryLogDto } from './dto/inventory.dto';
import { NotificationGateway } from '../notification/notification.gateway';
export declare class InventoryService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationGateway);
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
        productId: string;
        reference: string | null;
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
        productId: string;
        reference: string | null;
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
