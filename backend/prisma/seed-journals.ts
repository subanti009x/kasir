/**
 * Backfill Script: Generate journal entries from existing historical data.
 *
 * Run with: npx ts-node prisma/seed-journals.ts
 *
 * This script:
 * 1. Finds all completed transactions without journal entries and creates SALE journals
 * 2. Finds all refunded transactions without journal entries and creates REFUND journals
 * 3. Finds all received purchase orders without journal entries and creates PURCHASE journals
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting journal entry backfill...\n');

  // ── 1. Backfill SALE journal entries ──────────────────

  const completedTransactions = await prisma.transaction.findMany({
    where: { status: 'COMPLETED' },
    include: {
      items: { include: { product: { select: { purchasePrice: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  let salesCreated = 0;
  for (const tx of completedTransactions) {
    // Check if journal already exists
    const existing = await prisma.journalEntry.findFirst({
      where: { referenceType: 'SALE', referenceId: tx.id },
    });
    if (existing) continue;

    let totalCogs = 0;
    for (const item of tx.items) {
      totalCogs += (item.product.purchasePrice || 0) * item.quantity;
    }

    const lines: { accountCategory: string; debit: number; credit: number; label?: string }[] = [
      { accountCategory: 'CASH', debit: tx.total, credit: 0 },
      { accountCategory: 'SALES_REVENUE', debit: 0, credit: tx.total },
    ];
    if (totalCogs > 0) {
      lines.push(
        { accountCategory: 'COGS', debit: totalCogs, credit: 0 },
        { accountCategory: 'INVENTORY', debit: 0, credit: totalCogs },
      );
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

  // ── 2. Backfill REFUND journal entries ────────────────

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
    if (existing) continue;

    let totalCogs = 0;
    for (const item of tx.items) {
      totalCogs += (item.product.purchasePrice || 0) * item.quantity;
    }

    const lines: { accountCategory: string; debit: number; credit: number; label?: string }[] = [
      { accountCategory: 'SALES_REVENUE', debit: tx.total, credit: 0 },
      { accountCategory: 'CASH', debit: 0, credit: tx.total },
    ];
    if (totalCogs > 0) {
      lines.push(
        { accountCategory: 'INVENTORY', debit: totalCogs, credit: 0 },
        { accountCategory: 'COGS', debit: 0, credit: totalCogs },
      );
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

  // ── 3. Backfill PURCHASE journal entries ──────────────

  const receivedPOs = await prisma.purchaseOrder.findMany({
    where: { status: { in: ['RECEIVED', 'PARTIAL'] } },
    orderBy: { createdAt: 'asc' },
  });

  let purchasesCreated = 0;
  for (const po of receivedPOs) {
    const existing = await prisma.journalEntry.findFirst({
      where: { referenceType: 'PURCHASE', referenceId: po.id },
    });
    if (existing) continue;

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
