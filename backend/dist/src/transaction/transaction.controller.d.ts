import { TransactionService } from './transaction.service';
import { CheckoutDto } from './dto/transaction.dto';
export declare class TransactionController {
    private readonly transactionService;
    constructor(transactionService: TransactionService);
    checkout(dto: CheckoutDto, user: any): Promise<{
        customer: {
            id: string;
            name: string;
        } | null;
        cashier: {
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
            subtotal: number;
            quantity: number;
            unitPrice: number;
            productId: string;
            transactionId: string;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            method: string;
            amount: number;
            reference: string | null;
            transactionId: string;
        }[];
    } & {
        paymentMethod: string;
        id: string;
        receiptId: string;
        subtotal: number;
        discount: number;
        discountType: string | null;
        tax: number;
        total: number;
        amountPaid: number;
        changeDue: number;
        status: string;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        cashierId: string;
        customerId: string | null;
    }>;
    findAll(user: any, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
        data: ({
            customer: {
                id: string;
                name: string;
            } | null;
            cashier: {
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
                subtotal: number;
                quantity: number;
                unitPrice: number;
                productId: string;
                transactionId: string;
            })[];
            whatsappLogs: {
                id: string;
                status: string;
                event: string;
                errorMessage: string | null;
                sentAt: Date | null;
            }[];
        } & {
            paymentMethod: string;
            id: string;
            receiptId: string;
            subtotal: number;
            discount: number;
            discountType: string | null;
            tax: number;
            total: number;
            amountPaid: number;
            changeDue: number;
            status: string;
            note: string | null;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            cashierId: string;
            customerId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            name: string;
            address: string | null;
            phone: string | null;
            email: string | null;
        } | null;
        cashier: {
            id: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
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
            productId: string;
            transactionId: string;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            method: string;
            amount: number;
            reference: string | null;
            transactionId: string;
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
        paymentMethod: string;
        id: string;
        receiptId: string;
        subtotal: number;
        discount: number;
        discountType: string | null;
        tax: number;
        total: number;
        amountPaid: number;
        changeDue: number;
        status: string;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        cashierId: string;
        customerId: string | null;
    }>;
    refund(id: string, user: any): Promise<{
        paymentMethod: string;
        id: string;
        receiptId: string;
        subtotal: number;
        discount: number;
        discountType: string | null;
        tax: number;
        total: number;
        amountPaid: number;
        changeDue: number;
        status: string;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        cashierId: string;
        customerId: string | null;
    }>;
}
