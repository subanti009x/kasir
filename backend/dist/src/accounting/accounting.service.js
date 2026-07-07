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
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ACCOUNT = {
    CASH: 'CASH',
    INVENTORY: 'INVENTORY',
    ACCOUNTS_PAYABLE: 'ACCOUNTS_PAYABLE',
    OWNER_EQUITY: 'OWNER_EQUITY',
    RETAINED_EARNINGS: 'RETAINED_EARNINGS',
    SALES_REVENUE: 'SALES_REVENUE',
    COGS: 'COGS',
    OPERATING_EXPENSE: 'OPERATING_EXPENSE',
};
let AccountingService = class AccountingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createExpense(tenantId, userId, dto) {
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
    async listExpenses(tenantId, startDate, endDate) {
        const where = { tenantId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = new Date(startDate);
            if (endDate)
                where.date.lte = new Date(endDate + 'T23:59:59.999Z');
        }
        return this.prisma.expense.findMany({
            where,
            include: {
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { date: 'desc' },
        });
    }
    async deleteExpense(tenantId, id) {
        const expense = await this.prisma.expense.findFirst({
            where: { id, tenantId },
        });
        if (!expense)
            throw new common_1.NotFoundException('Expense not found');
        await this.prisma.journalEntry.deleteMany({
            where: { tenantId, referenceType: 'EXPENSE', referenceId: id },
        });
        return this.prisma.expense.delete({ where: { id } });
    }
    async createJournalEntry(tenantId, data) {
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
    async generateSaleJournal(tenantId, transaction) {
        let totalCogs = 0;
        for (const item of transaction.items) {
            totalCogs += (item.product.purchasePrice || 0) * item.quantity;
        }
        const lines = [
            { accountCategory: ACCOUNT.CASH, debit: transaction.total, credit: 0 },
            { accountCategory: ACCOUNT.SALES_REVENUE, debit: 0, credit: transaction.total },
        ];
        if (totalCogs > 0) {
            lines.push({ accountCategory: ACCOUNT.COGS, debit: totalCogs, credit: 0 }, { accountCategory: ACCOUNT.INVENTORY, debit: 0, credit: totalCogs });
        }
        return this.createJournalEntry(tenantId, {
            entryDate: transaction.createdAt,
            description: `Sale ${transaction.receiptId}`,
            referenceType: 'SALE',
            referenceId: transaction.id,
            lines,
        });
    }
    async generateRefundJournal(tenantId, transaction) {
        let totalCogs = 0;
        for (const item of transaction.items) {
            totalCogs += (item.product.purchasePrice || 0) * item.quantity;
        }
        const lines = [
            { accountCategory: ACCOUNT.SALES_REVENUE, debit: transaction.total, credit: 0 },
            { accountCategory: ACCOUNT.CASH, debit: 0, credit: transaction.total },
        ];
        if (totalCogs > 0) {
            lines.push({ accountCategory: ACCOUNT.INVENTORY, debit: totalCogs, credit: 0 }, { accountCategory: ACCOUNT.COGS, debit: 0, credit: totalCogs });
        }
        return this.createJournalEntry(tenantId, {
            entryDate: transaction.createdAt,
            description: `Refund ${transaction.receiptId}`,
            referenceType: 'REFUND',
            referenceId: transaction.id,
            lines,
        });
    }
    async generatePurchaseJournal(tenantId, purchaseOrder) {
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
    async getBalanceSheet(tenantId, asOfDate) {
        const endDate = asOfDate ? new Date(asOfDate + 'T23:59:59.999Z') : new Date();
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
        const balances = {};
        for (const row of aggregation) {
            const debit = row._sum.debit || 0;
            const credit = row._sum.credit || 0;
            balances[row.accountCategory] = debit - credit;
        }
        const cash = balances[ACCOUNT.CASH] || 0;
        const inventory = balances[ACCOUNT.INVENTORY] || 0;
        const totalAssets = cash + inventory;
        const accountsPayable = -(balances[ACCOUNT.ACCOUNTS_PAYABLE] || 0);
        const totalLiabilities = accountsPayable;
        const salesRevenue = -(balances[ACCOUNT.SALES_REVENUE] || 0);
        const cogs = balances[ACCOUNT.COGS] || 0;
        const operatingExpenses = balances[ACCOUNT.OPERATING_EXPENSE] || 0;
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
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        };
    }
    async getProfitLoss(tenantId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate + 'T23:59:59.999Z');
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
        const balances = {};
        for (const row of aggregation) {
            balances[row.accountCategory] = (row._sum.debit || 0) - (row._sum.credit || 0);
        }
        const revenue = -(balances[ACCOUNT.SALES_REVENUE] || 0);
        const cogs = balances[ACCOUNT.COGS] || 0;
        const grossProfit = revenue - cogs;
        const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const totalOperatingExpenses = balances[ACCOUNT.OPERATING_EXPENSE] || 0;
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
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map