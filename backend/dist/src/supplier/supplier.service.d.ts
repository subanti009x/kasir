import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SupplierService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
        purchaseOrders: {
            status: string;
            createdAt: Date;
            totalAmount: number;
        }[];
        _count: {
            purchaseOrders: number;
        };
    } & {
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        purchaseOrders: ({
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
        })[];
        _count: {
            purchaseOrders: number;
        };
    } & {
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
    create(dto: CreateSupplierDto, tenantId: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
    update(id: string, dto: UpdateSupplierDto, tenantId: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
        contactPerson: string | null;
    }>;
}
