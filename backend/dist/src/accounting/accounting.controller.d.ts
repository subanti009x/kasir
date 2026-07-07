import { AccountingService } from './accounting.service';
import { CreateExpenseDto } from './dto/accounting.dto';
export declare class AccountingController {
    private readonly accountingService;
    constructor(accountingService: AccountingService);
    createExpense(user: any, dto: CreateExpenseDto): Promise<{
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
    listExpenses(user: any, startDate?: string, endDate?: string): Promise<({
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
    deleteExpense(user: any, id: string): Promise<{
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
    getBalanceSheet(user: any, asOfDate?: string): Promise<{
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
    getProfitLoss(user: any, startDate: string, endDate: string): Promise<{
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
