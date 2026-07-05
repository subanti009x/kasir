"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportService = class ReportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard(tenantId) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todaySales, monthlySales, todayTransactionCount, monthlyTransactionCount, totalProducts, totalCustomers, totalEmployees, lowStockProducts, recentTransactions,] = await Promise.all([
            this.prisma.transaction.aggregate({
                where: { tenantId, status: 'COMPLETED', createdAt: { gte: todayStart } },
                _sum: { total: true, discount: true, tax: true },
                _count: true,
            }),
            this.prisma.transaction.aggregate({
                where: { tenantId, status: 'COMPLETED', createdAt: { gte: monthStart } },
                _sum: { total: true, discount: true, tax: true },
                _count: true,
            }),
            this.prisma.transaction.count({
                where: { tenantId, status: 'COMPLETED', createdAt: { gte: todayStart } },
            }),
            this.prisma.transaction.count({
                where: { tenantId, status: 'COMPLETED', createdAt: { gte: monthStart } },
            }),
            this.prisma.product.count({ where: { tenantId, status: 'ACTIVE' } }),
            this.prisma.customer.count({ where: { tenantId } }),
            this.prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }),
            this.prisma.product.findMany({
                where: { tenantId, status: 'ACTIVE' },
                select: { id: true, name: true, sku: true, stock: true, minStock: true },
                orderBy: { stock: 'asc' },
            }),
            this.prisma.transaction.findMany({
                where: { tenantId },
                include: {
                    cashier: { select: { name: true } },
                    customer: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const filteredLowStock = lowStockProducts.filter((p) => p.stock <= p.minStock);
        return {
            todaySales: todaySales._sum.total || 0,
            todayTransactions: todayTransactionCount,
            monthlySales: monthlySales._sum.total || 0,
            monthlyTransactions: monthlyTransactionCount,
            totalProducts,
            totalCustomers,
            totalEmployees,
            lowStockCount: filteredLowStock.length,
            lowStockProducts: filteredLowStock.slice(0, 10),
            recentTransactions,
        };
    }
    async getSalesReport(tenantId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate + 'T23:59:59.999Z');
        const transactions = await this.prisma.transaction.findMany({
            where: {
                tenantId,
                status: 'COMPLETED',
                createdAt: { gte: start, lte: end },
            },
            include: {
                items: { include: { product: { select: { id: true, name: true, purchasePrice: true } } } },
                cashier: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalDiscount = transactions.reduce((sum, t) => sum + t.discount, 0);
        const totalTax = transactions.reduce((sum, t) => sum + t.tax, 0);
        let totalProfit = 0;
        const productSalesMap = new Map();
        for (const tx of transactions) {
            for (const item of tx.items) {
                const profit = (item.unitPrice - (item.product.purchasePrice || 0)) * item.quantity;
                totalProfit += profit;
                const existing = productSalesMap.get(item.productId) || { name: item.product.name, quantity: 0, revenue: 0 };
                existing.quantity += item.quantity;
                existing.revenue += item.subtotal;
                productSalesMap.set(item.productId, existing);
            }
        }
        const bestSellers = Array.from(productSalesMap.entries())
            .map(([id, data]) => ({ productId: id, ...data }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
        const dailyMap = new Map();
        for (const tx of transactions) {
            const day = tx.createdAt.toISOString().slice(0, 10);
            const existing = dailyMap.get(day) || { sales: 0, transactions: 0 };
            existing.sales += tx.total;
            existing.transactions += 1;
            dailyMap.set(day, existing);
        }
        const dailyBreakdown = Array.from(dailyMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
        const paymentMethods = new Map();
        for (const tx of transactions) {
            const existing = paymentMethods.get(tx.paymentMethod) || { count: 0, total: 0 };
            existing.count += 1;
            existing.total += tx.total;
            paymentMethods.set(tx.paymentMethod, existing);
        }
        return {
            period: { startDate, endDate },
            summary: {
                totalRevenue,
                totalProfit,
                totalDiscount,
                totalTax,
                transactionCount: transactions.length,
                averageTransaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
            },
            bestSellers,
            dailyBreakdown,
            paymentMethods: Array.from(paymentMethods.entries()).map(([method, data]) => ({ method, ...data })),
        };
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportService);
//# sourceMappingURL=report.service.js.map