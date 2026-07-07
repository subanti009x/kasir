import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchase-order.dto';
export declare class PurchaseOrderController {
    private readonly poService;
    constructor(poService: PurchaseOrderService);
    findAll(user: any, status?: string): Promise<({
        items: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            unitCost: number;
            receivedQty: number;
            purchaseOrderId: string;
        })[];
        supplier: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        status: string;
        note: string | null;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    })[]>;
    findOne(id: string, user: any): Promise<{
        items: ({
            product: {
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
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            unitCost: number;
            receivedQty: number;
            purchaseOrderId: string;
        })[];
        supplier: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
    } & {
        id: string;
        status: string;
        note: string | null;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
    create(dto: CreatePurchaseOrderDto, user: any): Promise<{
        items: ({
            product: {
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
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            unitCost: number;
            receivedQty: number;
            purchaseOrderId: string;
        })[];
        supplier: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
    } & {
        id: string;
        status: string;
        note: string | null;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
    receive(id: string, dto: ReceivePurchaseOrderDto, user: any): Promise<{
        items: ({
            product: {
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
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            unitCost: number;
            receivedQty: number;
            purchaseOrderId: string;
        })[];
        supplier: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
    } & {
        id: string;
        status: string;
        note: string | null;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
    cancel(id: string, user: any): Promise<{
        id: string;
        status: string;
        note: string | null;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
}
