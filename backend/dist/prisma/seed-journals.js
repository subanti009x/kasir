"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🔄 Starting journal entry backfill...\n');
    const completedTransactions = await prisma.transaction.findMany({
        where: { status: 'COMPLETED' },
        include: {
            items: { include: { product: { select: { purchasePrice: true } } } },
        },
        orderBy: { createdAt: 'asc' },
    });
    let salesCreated = 0;
    for (const tx of completedTransactions) {
        const existing = await prisma.journalEntry.findFirst({
            where: { referenceType: 'SALE', referenceId: tx.id },
        });
        if (existing)
            continue;
        let totalCogs = 0;
        for (const item of tx.items) {
            totalCogs += (item.product.purchasePrice || 0) * item.quantity;
        }
        const lines = [
            { accountCategory: 'CASH', debit: tx.total, credit: 0 },
            { accountCategory: 'SALES_REVENUE', debit: 0, credit: tx.total },
        ];
        if (totalCogs > 0) {
            lines.push({ accountCategory: 'COGS', debit: totalCogs, credit: 0 }, { accountCategory: 'INVENTORY', debit: 0, credit: totalCogs });
        }
        await prisma.journalEntry.create({
            data: {
                tenantId: tx.tenantId,
                entryDate: tx.createdAt,
                description: `Sale ${tx.receiptId}`,
                referenceType: 'SALE',
                referenceId: tx.id,
                lines: { create: lines },
            },
        });
        salesCreated++;
    }
    console.log(`✅ Created ${salesCreated} SALE journal entries`);
    const refundedTransactions = await prisma.transaction.findMany({
        where: { status: 'REFUNDED' },
        include: {
            items: { include: { product: { select: { purchasePrice: true } } } },
        },
        orderBy: { createdAt: 'asc' },
    });
    let refundsCreated = 0;
    for (const tx of refundedTransactions) {
        const existing = await prisma.journalEntry.findFirst({
            where: { referenceType: 'REFUND', referenceId: tx.id },
        });
        if (existing)
            continue;
        let totalCogs = 0;
        for (const item of tx.items) {
            totalCogs += (item.product.purchasePrice || 0) * item.quantity;
        }
        const lines = [
            { accountCategory: 'SALES_REVENUE', debit: tx.total, credit: 0 },
            { accountCategory: 'CASH', debit: 0, credit: tx.total },
        ];
        if (totalCogs > 0) {
            lines.push({ accountCategory: 'INVENTORY', debit: totalCogs, credit: 0 }, { accountCategory: 'COGS', debit: 0, credit: totalCogs });
        }
        await prisma.journalEntry.create({
            data: {
                tenantId: tx.tenantId,
                entryDate: tx.createdAt,
                description: `Refund ${tx.receiptId}`,
                referenceType: 'REFUND',
                referenceId: tx.id,
                lines: { create: lines },
            },
        });
        refundsCreated++;
    }
    console.log(`✅ Created ${refundsCreated} REFUND journal entries`);
    const receivedPOs = await prisma.purchaseOrder.findMany({
        where: { status: { in: ['RECEIVED', 'PARTIAL'] } },
        orderBy: { createdAt: 'asc' },
    });
    let purchasesCreated = 0;
    for (const po of receivedPOs) {
        const existing = await prisma.journalEntry.findFirst({
            where: { referenceType: 'PURCHASE', referenceId: po.id },
        });
        if (existing)
            continue;
        await prisma.journalEntry.create({
            data: {
                tenantId: po.tenantId,
                entryDate: po.createdAt,
                description: `Purchase Order ${po.orderNumber}`,
                referenceType: 'PURCHASE',
                referenceId: po.id,
                lines: {
                    create: [
                        { accountCategory: 'INVENTORY', debit: po.totalAmount, credit: 0 },
                        { accountCategory: 'CASH', debit: 0, credit: po.totalAmount },
                    ],
                },
            },
        });
        purchasesCreated++;
    }
    console.log(`✅ Created ${purchasesCreated} PURCHASE journal entries`);
    console.log(`\n🎉 Backfill complete! Total: ${salesCreated + refundsCreated + purchasesCreated} journal entries created.`);
}
main()
    .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-journals.js.map