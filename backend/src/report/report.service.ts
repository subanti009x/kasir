import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todaySales,
      monthlySales,
      todayTransactionCount,
      monthlyTransactionCount,
      totalProducts,
      totalCustomers,
      totalEmployees,
      lowStockProducts,
      recentTransactions,
    ] = await Promise.all([
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

  async getSalesReport(tenantId: string, startDate: string, endDate: string) {
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

    // Calculate profit (selling price - purchase price)
    let totalProfit = 0;
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();

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

    // Daily breakdown
    const dailyMap = new Map<string, { sales: number; transactions: number }>();
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

    // Payment method breakdown
    const paymentMethods = new Map<string, { count: number; total: number }>();
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
}
