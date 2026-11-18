import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductService } from './product.service.js';

describe('ProductService', () => {
  const product = {
    id: 'product-1',
    name: 'Teh Botol',
    sku: 'TEH-001',
    purchasePrice: 1000,
    sellingPrice: 1500,
    stock: 4,
    minStock: 0,
  };

  let prisma: any;
  let service: ProductService;

  beforeEach(() => {
    prisma = {
      tenantFeature: { findFirst: jest.fn().mockResolvedValue(null) },
      category: { findFirst: jest.fn() },
      product: {
        create: jest.fn().mockResolvedValue(product),
        findFirst: jest.fn().mockResolvedValue(product),
        update: jest.fn().mockResolvedValue(product),
      },
      productUnit: { deleteMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: any) => unknown) =>
        callback({ productUnit: prisma.productUnit, product: prisma.product }),
      ),
    };
    service = new ProductService(prisma);
  });

  it('creates a product with zero prices and stock', async () => {
    const result = await service.create(
      { name: 'Teh Botol', sku: 'TEH-001', purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 0 },
      'tenant-1',
    );

    expect(result).toEqual(product);
    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: 'tenant-1', purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 0 }),
    }));
  });

  it('updates product values without losing zero prices or stock', async () => {
    const result = await service.update(
      'product-1',
      { purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 0 },
      'tenant-1',
    );

    expect(result).toEqual(product);
    expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 0 }),
    }));
  });

  it('returns a conflict instead of an internal error when a SKU is already used', async () => {
    prisma.product.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
      meta: { target: ['tenantId', 'sku'] },
    }));

    await expect(service.create(
      { name: 'Produk Duplikat', sku: 'TEH-001', purchasePrice: 1000, sellingPrice: 1500 },
      'tenant-1',
    )).rejects.toThrow(new ConflictException('SKU produk sudah digunakan. Gunakan SKU yang berbeda.'));
  });
});
