import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantSlug = process.env.TOKO_FAJAR_TENANT_SLUG || 'toko-fajar';
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

  if (!tenant) {
    throw new Error(
      `Tenant "${tenantSlug}" was not found. Create Toko Fajar through the application first, then run this setup again.`,
    );
  }

  const features = [
    {
      code: 'WHOLESALE_PRICING',
      name: 'Harga Umum dan Harga Bakul',
      description:
        'Atur harga umum dan harga khusus pelanggan bakul/reseller; harga bakul diterapkan otomatis saat pelanggan bakul dipilih di kasir.',
      category: 'POS',
    },
    {
      code: 'MULTI_UNIT',
      name: 'Multi-Satuan Produk',
      description:
        'Jual produk dalam satuan berbeda dengan konversi stok, seperti pcs, renteng, dus, gram, dan kilogram.',
      category: 'POS',
    },
    {
      code: 'EXPIRY_DATE',
      name: 'Expired Date Produk',
      description: 'Simpan dan pantau tanggal kedaluwarsa produk.',
      category: 'INVENTORY',
    },
  ];

  for (const feature of features) {
    const record = await prisma.exclusiveFeature.upsert({
      where: { code: feature.code },
      update: { ...feature, isActive: true },
      create: { ...feature, isActive: true },
    });

    await prisma.tenantFeature.upsert({
      where: {
        tenantId_featureId: { tenantId: tenant.id, featureId: record.id },
      },
      update: { enabled: true },
      create: { tenantId: tenant.id, featureId: record.id, enabled: true },
    });
  }

  const fajarReceipt = await prisma.exclusiveFeature.upsert({
    where: { code: 'FAJAR_CLIENT_RECEIPT' },
    update: {
      name: 'Struk for Client Fajar',
      description: 'Format struk khusus Toko Fajar dengan identitas toko, rincian transaksi, pembayaran, kembalian, dan tautan kritik dan saran.',
      category: 'POS',
      isActive: true,
    },
    create: {
      code: 'FAJAR_CLIENT_RECEIPT',
      name: 'Struk for Client Fajar',
      description: 'Format struk khusus Toko Fajar dengan identitas toko, rincian transaksi, pembayaran, kembalian, dan tautan kritik dan saran.',
      category: 'POS',
      isActive: true,
    },
  });

  // This client-specific feature is restricted to the Fajar tenant only.
  await prisma.tenantFeature.deleteMany({
    where: { featureId: fajarReceipt.id, tenantId: { not: tenant.id } },
  });
  await prisma.tenantFeature.upsert({
    where: { tenantId_featureId: { tenantId: tenant.id, featureId: fajarReceipt.id } },
    update: { enabled: true },
    create: { tenantId: tenant.id, featureId: fajarReceipt.id, enabled: true },
  });

  const fajarReceiptAssignments = await prisma.tenantFeature.findMany({
    where: { featureId: fajarReceipt.id },
    include: { tenant: { select: { slug: true } } },
  });
  if (fajarReceiptAssignments.length !== 1 || fajarReceiptAssignments[0].tenant.slug !== tenantSlug) {
    throw new Error('Struk for Client Fajar must only be assigned to the Toko Fajar tenant.');
  }

  console.log(`Toko Fajar setup completed for tenant "${tenant.slug}". Struk for Client Fajar assignments: ${fajarReceiptAssignments.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
