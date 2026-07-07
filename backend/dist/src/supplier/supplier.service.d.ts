import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SupplierService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        _count: {
            purchaseOrders: number;
        };
        purchaseOrders: {
            status: string;
            createdAt: Date;
            totalAmount: number;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        _count: {
            purchaseOrders: number;
        };
        purchaseOrders: ({
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
        })[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
    create(dto: CreateSupplierDto, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
    update(id: string, dto: UpdateSupplierDto, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
}
