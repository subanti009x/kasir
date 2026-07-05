import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomerService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, search?: string): Promise<({
        transactions: {
            createdAt: Date;
            total: number;
        }[];
        _count: {
            transactions: number;
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
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        transactions: ({
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
                subtotal: number;
                quantity: number;
                unitPrice: number;
                transactionId: string;
                productId: string;
            })[];
        } & {
            id: string;
            status: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            paymentMethod: string;
            total: number;
            subtotal: number;
            discount: number;
            tax: number;
            amountPaid: number;
            changeDue: number;
            note: string | null;
            receiptId: string;
            discountType: string | null;
            cashierId: string;
            customerId: string | null;
        })[];
        _count: {
            transactions: number;
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
    }>;
    create(dto: CreateCustomerDto, tenantId: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
    }>;
    update(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
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
    }>;
}
