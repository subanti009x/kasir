import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchase-order.dto';
export declare class PurchaseOrderService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, status?: string): Promise<({
        supplier: {
            id: string;
            name: string;
        };
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
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        note: string | null;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        supplier: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
        items: ({
            product: {
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
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            unitCost: number;
            receivedQty: number;
            purchaseOrderId: string;
        })[];
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        note: string | null;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
    create(dto: CreatePurchaseOrderDto, tenantId: string): Promise<{
        supplier: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
        items: ({
            product: {
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
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            unitCost: number;
            receivedQty: number;
            purchaseOrderId: string;
        })[];
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        note: string | null;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
    receive(id: string, dto: ReceivePurchaseOrderDto, tenantId: string): Promise<{
        supplier: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            phone: string | null;
            contactPerson: string | null;
        };
        items: ({
            product: {
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
            };
        } & {
            id: string;
            quantity: number;
            productId: string;
            unitCost: number;
            receivedQty: number;
            purchaseOrderId: string;
        })[];
    } & {
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        note: string | null;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
    cancel(id: string, tenantId: string): Promise<{
        id: string;
        status: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        note: string | null;
        orderNumber: string;
        totalAmount: number;
        supplierId: string;
    }>;
}
