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

  console.log(`Toko Fajar setup completed for tenant "${tenant.slug}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
