import { SupplierService } from './supplier.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SupplierController {
    private readonly supplierService;
    constructor(supplierService: SupplierService);
    findAll(user: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    create(dto: CreateSupplierDto, user: any): Promise<{
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
    update(id: string, dto: UpdateSupplierDto, user: any): Promise<{
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
    remove(id: string, user: any): Promise<{
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
