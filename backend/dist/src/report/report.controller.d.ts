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
            customer: {
                name: string;
            } | null;
            cashier: {
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
