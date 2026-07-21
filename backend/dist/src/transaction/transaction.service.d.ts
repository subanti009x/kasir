import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/transaction.dto';
import { NotificationGateway } from '../notification/notification.gateway';
import { AccountingService } from '../accounting/accounting.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class TransactionService {
    private prisma;
    private notifications;
    private accounting;
    private whatsapp;
    constructor(prisma: PrismaService, notifications: NotificationGateway, accounting: AccountingService, whatsapp: WhatsappService);
    checkout(userId: string, tenantId: string, dto: CheckoutDto): Promise<{
        cashier: {
            id: string;
            name: string;
        };
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
    }>;
    private generateSaleAccounting;
    findAll(tenantId: string, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
        data: ({
            cashier: {
                id: string;
                name: string;
            };
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
            whatsappLogs: {
                id: string;
                status: string;
                event: string;
                errorMessage: string | null;
                sentAt: Date | null;
            }[];
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, tenantId: string): Promise<{
        cashier: {
            id: string;
            name: string;
        };
        customer: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            address: string | null;
            phone: string | null;
        } | null;
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
        payments: {
            id: string;
            createdAt: Date;
            transactionId: string;
            reference: string | null;
            method: string;
            amount: number;
        }[];
        whatsappLogs: {
            id: string;
            status: string;
            event: string;
            recipientPhone: string;
            recipientName: string;
            errorMessage: string | null;
            sentAt: Date | null;
        }[];
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
    }>;
    refund(id: string, tenantId: string): Promise<{
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
    }>;
}
