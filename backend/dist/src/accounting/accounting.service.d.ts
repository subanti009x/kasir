import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/accounting.dto';
export declare class AccountingService {
    private prisma;
    constructor(prisma: PrismaService);
    createExpense(tenantId: string, userId: string, dto: CreateExpenseDto): Promise<{
        createdBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        category: string;
        amount: number;
        date: Date;
        createdById: string;
    }>;
    listExpenses(tenantId: string, startDate?: string, endDate?: string): Promise<({
        createdBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        category: string;
        amount: number;
        date: Date;
        createdById: string;
    })[]>;
    deleteExpense(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        category: string;
        amount: number;
        date: Date;
        createdById: string;
    }>;
    private createJournalEntry;
    generateSaleJournal(tenantId: string, transaction: {
        id: string;
        receiptId: string;
        total: number;
        createdAt: Date;
        items: {
            quantity: number;
            unitPrice: number;
            product: {
                purchasePrice?: number | null;
            };
        }[];
    }): Promise<{
        lines: {
            id: string;
            accountCategory: string;
            debit: number;
            credit: number;
            label: string | null;
            journalEntryId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        description: string;
        entryDate: Date;
        referenceType: string;
        referenceId: string;
    }>;
    generateRefundJournal(tenantId: string, transaction: {
        id: string;
        receiptId: string;
        total: number;
        createdAt: Date;
        items: {
            quantity: number;
            unitPrice: number;
            product: {
                purchasePrice?: number | null;
            };
        }[];
    }): Promise<{
        lines: {
            id: string;
            accountCategory: string;
            debit: number;
            credit: number;
            label: string | null;
            journalEntryId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        description: string;
        entryDate: Date;
        referenceType: string;
        referenceId: string;
    }>;
    generatePurchaseJournal(tenantId: string, purchaseOrder: {
        id: string;
        orderNumber: string;
        totalAmount: number;
        createdAt: Date;
    }): Promise<{
        lines: {
            id: string;
            accountCategory: string;
            debit: number;
            credit: number;
            label: string | null;
            journalEntryId: string;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        description: string;
        entryDate: Date;
        referenceType: string;
        referenceId: string;
    }>;
    getBalanceSheet(tenantId: string, asOfDate?: string): Promise<{
        asOfDate: string;
        assets: {
            cash: number;
            inventory: number;
            total: number;
        };
        liabilities: {
            accountsPayable: number;
            total: number;
        };
        equity: {
            retainedEarnings: number;
            total: number;
        };
        isBalanced: boolean;
    }>;
    getProfitLoss(tenantId: string, startDate: string, endDate: string): Promise<{
        period: {
            startDate: string;
            endDate: string;
        };
        revenue: number;
        cogs: number;
        grossProfit: number;
        grossProfitMargin: number;
        operatingExpenses: {
            total: number;
            categories: {
                category: string;
                amount: number;
                count: number;
            }[];
        };
        netProfit: number;
        netProfitMargin: number;
    }>;
}
