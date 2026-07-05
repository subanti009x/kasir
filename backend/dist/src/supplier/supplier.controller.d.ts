import { SupplierService } from './supplier.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
export declare class SupplierController {
    private readonly supplierService;
    constructor(supplierService: SupplierService);
    findAll(user: any): Promise<({
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
    findOne(id: string, user: any): Promise<{
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
    create(dto: CreateSupplierDto, user: any): Promise<{
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
    update(id: string, dto: UpdateSupplierDto, user: any): Promise<{
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
    remove(id: string, user: any): Promise<{
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
