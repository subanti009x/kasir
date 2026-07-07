import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchase-order.dto';
import { AccountingService } from '../accounting/accounting.service';
export declare class PurchaseOrderService {
    private prisma;
    private accounting;
    constructor(prisma: PrismaService, accounting: AccountingService);
    findAll(tenantId: string, status?: string): Promise<({
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
    findOne(id: string, tenantId: string): Promise<{
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
    create(dto: CreatePurchaseOrderDto, tenantId: string): Promise<{
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
    receive(id: string, dto: ReceivePurchaseOrderDto, tenantId: string): Promise<{
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
    cancel(id: string, tenantId: string): Promise<{
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
