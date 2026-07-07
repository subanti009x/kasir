import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomerService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, search?: string): Promise<({
        _count: {
            transactions: number;
        };
        transactions: {
            total: number;
            createdAt: Date;
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
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        _count: {
            transactions: number;
        };
        transactions: ({
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
                subtotal: number;
                quantity: number;
                unitPrice: number;
                transactionId: string;
                productId: string;
            })[];
        } & {
            id: string;
            receiptId: string;
            subtotal: number;
            discount: number;
            discountType: string | null;
            tax: number;
            total: number;
            paymentMethod: string;
            amountPaid: number;
            changeDue: number;
            status: string;
            note: string | null;
            tenantId: string;
            cashierId: string;
            customerId: string | null;
            createdAt: Date;
            updatedAt: Date;
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
    }>;
    create(dto: CreateCustomerDto, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        address: string | null;
        phone: string | null;
    }>;
    update(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        address: string | null;
        phone: string | null;
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
    }>;
}
