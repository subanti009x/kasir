import { ReportService } from './report.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getDashboard(user: any): Promise<{
        todaySales: number;
        todayTransactions: number;
        monthlySales: number;
        monthlyTransactions: number;
        totalProducts: number;
        totalCustomers: number;
        totalEmployees: number;
        lowStockCount: number;
        lowStockProducts: {
            id: string;
            name: string;
            sku: string;
            stock: number;
            minStock: number;
        }[];
        recentTransactions: ({
            cashier: {
                name: string;
            };
            customer: {
                name: string;
            } | null;
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
    }>;
    getSalesReport(user: any, startDate: string, endDate: string): Promise<{
        period: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRevenue: number;
            totalProfit: number;
            totalDiscount: number;
            totalTax: number;
            transactionCount: number;
            averageTransaction: number;
        };
        bestSellers: {
            name: string;
            quantity: number;
            revenue: number;
            productId: string;
        }[];
        dailyBreakdown: {
            sales: number;
            transactions: number;
            date: string;
        }[];
        paymentMethods: {
            count: number;
            total: number;
            method: string;
        }[];
    }>;
}
