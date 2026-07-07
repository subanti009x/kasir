import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/accounting.dto';

// Account category constants
const ACCOUNT = {
  CASH: 'CASH',
  INVENTORY: 'INVENTORY',
  ACCOUNTS_PAYABLE: 'ACCOUNTS_PAYABLE',
  OWNER_EQUITY: 'OWNER_EQUITY',
  RETAINED_EARNINGS: 'RETAINED_EARNINGS',
  SALES_REVENUE: 'SALES_REVENUE',
  COGS: 'COGS',
  OPERATING_EXPENSE: 'OPERATING_EXPENSE',
} as const;

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------
  // Expense Management
  // -------------------------------------------------------

  async createExpense(tenantId: string, userId: string, dto: CreateExpenseDto) {
    const expense = await this.prisma.expense.create({
      data: {
        tenantId,
        createdById: userId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Auto-generate journal entry for this expense
    await this.createJournalEntry(tenantId, {
      entryDate: new Date(dto.date),
      description: `Expense: ${dto.description}`,
      referenceType: 'EXPENSE',
      referenceId: expense.id,
      lines: [
        { accountCategory: ACCOUNT.OPERATING_EXPENSE, debit: dto.amount, credit: 0, label: dto.category },
        { accountCategory: ACCOUNT.CASH, debit: 0, credit: dto.amount },
      ],
    });

    return expense;
  }

  async listExpenses(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async deleteExpense(tenantId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    // Delete associated journal entry
    await this.prisma.journalEntry.deleteMany({
      where: { tenantId, referenceType: 'EXPENSE', referenceId: id },
    });

    return this.prisma.expense.delete({ where: { id } });
  }

  // -------------------------------------------------------
  // Journal Entry Creation (called from other services)
  // -------------------------------------------------------

  private async createJournalEntry(
    tenantId: string,
    data: {
      entryDate: Date;
      description: string;
      referenceType: string;
      referenceId: string;
      lines: { accountCategory: string; debit: number; credit: number; label?: string }[];
    },
  ) {
    return this.prisma.journalEntry.create({
      data: {
        tenantId,
        entryDate: data.entryDate,
        description: data.description,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        lines: {
          create: data.lines.map((line) => ({
            accountCategory: line.accountCategory,
            debit: line.debit,
            credit: line.credit,
            label: line.label,
          })),
        },
      },
      include: { lines: true },
    });
  }

  /**
   * Generate journal entries for a completed sale.
   * Debit CASH (total received), Credit SALES_REVENUE (total)
   * Debit COGS (cost of items), Credit INVENTORY (cost of items)
   */
  async generateSaleJournal(
    tenantId: string,
    transaction: {
      id: string;
      receiptId: string;
      total: number;
      createdAt: Date;
      items: { quantity: number; unitPrice: number; product: { purchasePrice?: number | null } }[];
    },
  ) {
    // Calculate COGS
    let totalCogs = 0;
    for (const item of transaction.items) {
      totalCogs += (item.product.purchasePrice || 0) * item.quantity;
    }

    const lines: { accountCategory: string; debit: number; credit: number; label?: string }[] = [
      { accountCategory: ACCOUNT.CASH, debit: transaction.total, credit: 0 },
      { accountCategory: ACCOUNT.SALES_REVENUE, debit: 0, credit: transaction.total },
    ];

    if (totalCogs > 0) {
      lines.push(
        { accountCategory: ACCOUNT.COGS, debit: totalCogs, credit: 0 },
        { accountCategory: ACCOUNT.INVENTORY, debit: 0, credit: totalCogs },
      );
    }

    return this.createJournalEntry(tenantId, {
      entryDate: transaction.createdAt,
      description: `Sale ${transaction.receiptId}`,
      referenceType: 'SALE',
      referenceId: transaction.id,
      lines,
    });
  }

  /**
   * Generate reversal journal entries for a refund.
   * Debit SALES_REVENUE, Credit CASH
   * Debit INVENTORY, Credit COGS
   */
  async generateRefundJournal(
    tenantId: string,
    transaction: {
      id: string;
      receiptId: string;
      total: number;
      createdAt: Date;
      items: { quantity: number; unitPrice: number; product: { purchasePrice?: number | null } }[];
    },
  ) {
    let totalCogs = 0;
    for (const item of transaction.items) {
      totalCogs += (item.product.purchasePrice || 0) * item.quantity;
    }

    const lines: { accountCategory: string; debit: number; credit: number; label?: string }[] = [
      { accountCategory: ACCOUNT.SALES_REVENUE, debit: transaction.total, credit: 0 },
      { accountCategory: ACCOUNT.CASH, debit: 0, credit: transaction.total },
    ];

    if (totalCogs > 0) {
      lines.push(
        { accountCategory: ACCOUNT.INVENTORY, debit: totalCogs, credit: 0 },
        { accountCategory: ACCOUNT.COGS, debit: 0, credit: totalCogs },
      );
    }

    return this.createJournalEntry(tenantId, {
      entryDate: transaction.createdAt,
      description: `Refund ${transaction.receiptId}`,
      referenceType: 'REFUND',
      referenceId: transaction.id,
      lines,
    });
  }

  /**
   * Generate journal entry for a received purchase order.
   * Debit INVENTORY (total cost), Credit CASH (total cost)
   */
  async generatePurchaseJournal(
    tenantId: string,
    purchaseOrder: {
      id: string;
      orderNumber: string;
      totalAmount: number;
      createdAt: Date;
    },
  ) {
    return this.createJournalEntry(tenantId, {
      entryDate: purchaseOrder.createdAt,
      description: `Purchase Order ${purchaseOrder.orderNumber}`,
      referenceType: 'PURCHASE',
      referenceId: purchaseOrder.id,
      lines: [
        { accountCategory: ACCOUNT.INVENTORY, debit: purchaseOrder.totalAmount, credit: 0 },
        { accountCategory: ACCOUNT.CASH, debit: 0, credit: purchaseOrder.totalAmount },
      ],
    });
  }

  // -------------------------------------------------------
  // Financial Statements
  // -------------------------------------------------------

  /**
   * Compute the Balance Sheet as of a given date.
   * Assets = Cash + Inventory
   * Liabilities = Accounts Payable
   * Equity = Retained Earnings (Assets - Liabilities)
   */
  async getBalanceSheet(tenantId: string, asOfDate?: string) {
    const endDate = asOfDate ? new Date(asOfDate + 'T23:59:59.999Z') : new Date();

    // Aggregate all journal entry lines up to the given date
    const aggregation = await this.prisma.journalEntryLine.groupBy({
      by: ['accountCategory'],
      where: {
        journalEntry: {
          tenantId,
          entryDate: { lte: endDate },
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const balances: Record<string, number> = {};
    for (const row of aggregation) {
      const debit = row._sum.debit || 0;
      const credit = row._sum.credit || 0;
      // For asset/expense accounts: balance = debit - credit
      // For liability/revenue/equity accounts: balance = credit - debit
      balances[row.accountCategory] = debit - credit;
    }

    // Assets (debit-normal: debit - credit)
    const cash = balances[ACCOUNT.CASH] || 0;
    const inventory = balances[ACCOUNT.INVENTORY] || 0;
    const totalAssets = cash + inventory;

    // Liabilities (credit-normal: credit - debit, so negate our balance)
    const accountsPayable = -(balances[ACCOUNT.ACCOUNTS_PAYABLE] || 0);
    const totalLiabilities = accountsPayable;

    // Revenue & Expenses for retained earnings calc
    const salesRevenue = -(balances[ACCOUNT.SALES_REVENUE] || 0); // credit-normal
    const cogs = balances[ACCOUNT.COGS] || 0; // debit-normal
    const operatingExpenses = balances[ACCOUNT.OPERATING_EXPENSE] || 0; // debit-normal
    const retainedEarnings = salesRevenue - cogs - operatingExpenses;

    const totalEquity = retainedEarnings;

    return {
      asOfDate: endDate.toISOString().slice(0, 10),
      assets: {
        cash,
        inventory,
        total: totalAssets,
      },
      liabilities: {
        accountsPayable,
        total: totalLiabilities,
      },
      equity: {
        retainedEarnings,
        total: totalEquity,
      },
      // Verification: Assets = Liabilities + Equity
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  /**
   * Compute the Profit & Loss statement for a given period.
   */
  async getProfitLoss(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    // Aggregate journal entry lines within the period
    const aggregation = await this.prisma.journalEntryLine.groupBy({
      by: ['accountCategory'],
      where: {
        journalEntry: {
          tenantId,
          entryDate: { gte: start, lte: end },
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const balances: Record<string, number> = {};
    for (const row of aggregation) {
      balances[row.accountCategory] = (row._sum.debit || 0) - (row._sum.credit || 0);
    }

    // Revenue (credit-normal, so negate)
    const revenue = -(balances[ACCOUNT.SALES_REVENUE] || 0);

    // COGS (debit-normal)
    const cogs = balances[ACCOUNT.COGS] || 0;

    const grossProfit = revenue - cogs;
    const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // Operating Expenses (debit-normal)
    const totalOperatingExpenses = balances[ACCOUNT.OPERATING_EXPENSE] || 0;

    // Get expense breakdown by category
    const expenseBreakdown = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        tenantId,
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: true,
    });

    const expenseCategories = expenseBreakdown.map((e) => ({
      category: e.category,
      amount: e._sum.amount || 0,
      count: e._count,
    }));

    const netProfit = grossProfit - totalOperatingExpenses;
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      period: { startDate, endDate },
      revenue,
      cogs,
      grossProfit,
      grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      operatingExpenses: {
        total: totalOperatingExpenses,
        categories: expenseCategories,
      },
      netProfit,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
    };
  }
}
