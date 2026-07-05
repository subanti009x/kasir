import { InventoryService } from './inventory.service';
import { CreateInventoryLogDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(user: any, productId?: string): Promise<({
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
    getLowStock(user: any): Promise<{
        id: string;
        name: string;
        category: {
            name: string;
        } | null;
        sku: string;
        stock: number;
        minStock: number;
    }[]>;
    create(dto: CreateInventoryLogDto, user: any): Promise<{
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
}
