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
        note: string | null;
        tenantId: string;
        createdAt: Date;
        quantity: number;
        productId: string;
        type: string;
        reference: string | null;
    })[]>;
    getLowStock(user: any): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        minStock: number;
        category: {
            name: string;
        } | null;
    }[]>;
    create(dto: CreateInventoryLogDto, user: any): Promise<{
        product: {
            id: string;
            name: string;
            sku: string;
        };
    } & {
        id: string;
        note: string | null;
        tenantId: string;
        createdAt: Date;
        quantity: number;
        productId: string;
        type: string;
        reference: string | null;
    }>;
}
