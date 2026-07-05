import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/transaction.dto';
import { NotificationGateway } from '../notification/notification.gateway';
export declare class TransactionService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationGateway);
    checkout(userId: string, tenantId: string, dto: CheckoutDto): Promise<{
        customer: {
            id: string;
            name: string;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                sku: string;
            };
        } & {
            id: string;
            subtotal: number;
            quantity: number;
            unitPrice: number;
            transactionId: string;
            productId: string;
        })[];
        cashier: {
            id: string;
            name: string;
        };
        payments: {
            id: string;
            createdAt: Date;
            transactionId: string;
            reference: string | null;
            method: string;
            amount: number;
        }[];
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
    }>;
    findAll(tenantId: string, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
        data: ({
            customer: {
                id: string;
                name: string;
            } | null;
            items: ({
                product: {
                    id: string;
                    name: string;
                    sku: string;
                };
            } & {
                id: string;
                subtotal: number;
                quantity: number;
                unitPrice: number;
                transactionId: string;
                productId: string;
            })[];
            cashier: {
                id: string;
                name: string;
            };
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, tenantId: string): Promise<{
        customer: {
            id: string;
            email: string | null;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            phone: string | null;
        } | null;
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
        cashier: {
            id: string;
            name: string;
        };
        payments: {
            id: string;
            createdAt: Date;
            transactionId: string;
            reference: string | null;
            method: string;
            amount: number;
        }[];
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
    }>;
    refund(id: string, tenantId: string): Promise<{
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
    }>;
}
