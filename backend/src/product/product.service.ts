import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';

type UploadedProductImage = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  private hasFeature(tenantId: string, code: string) {
    return this.prisma.tenantFeature.findFirst({
      where: { tenantId, enabled: true, feature: { code, isActive: true } },
      select: { id: true },
    });
  }

  private async validateExclusiveFields(tenantId: string, dto: CreateProductDto | UpdateProductDto) {
    const [wholesale, multiUnit, expiry] = await Promise.all([
      this.hasFeature(tenantId, 'WHOLESALE_PRICING'),
      this.hasFeature(tenantId, 'MULTI_UNIT'),
      this.hasFeature(tenantId, 'EXPIRY_DATE'),
    ]);

    if (!wholesale && 'wholesalePrice' in dto && dto.wholesalePrice !== undefined) {
      throw new BadRequestException('Harga bakul belum diaktifkan untuk toko ini');
    }
    if (!multiUnit && ('units' in dto || ('baseUnit' in dto && dto.baseUnit !== undefined))) {
      throw new BadRequestException('Multi-satuan belum diaktifkan untuk toko ini');
    }
    if (!expiry && 'expiresAt' in dto && dto.expiresAt !== undefined) {
      throw new BadRequestException('Pengelolaan tanggal kedaluwarsa belum diaktifkan untuk toko ini');
    }

    if (!wholesale && dto.units?.some((unit) => unit.wholesalePrice !== undefined)) {
      throw new BadRequestException('Harga bakul per satuan belum diaktifkan untuk toko ini');
    }
  }

  async findAll(tenantId: string, search?: string, categoryId?: string) {
    const where: any = { tenantId };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, color: true } }, units: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true, units: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto, tenantId: string) {
    await this.validateExclusiveFields(tenantId, dto);
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) throw new NotFoundException('Category not found in this tenant');
    }

    const { units, expiresAt, ...data } = dto;
    return this.prisma.product.create({
      data: {
        ...data,
        tenantId,
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
        ...(units !== undefined ? { units: { create: units } } : {}),
      },
      include: { category: true, units: true },
    });
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    await this.validateExclusiveFields(tenantId, dto);
    await this.findOne(id, tenantId);
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) throw new NotFoundException('Category not found in this tenant');
    }
    const { units, expiresAt, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (units !== undefined) {
        await tx.productUnit.deleteMany({ where: { productId: id } });
      }
      return tx.product.update({
        where: { id },
        data: {
          ...data,
          ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
          ...(units !== undefined ? { units: { create: units } } : {}),
        },
        include: { category: true, units: true },
      });
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.product.delete({ where: { id } });
  }

  async uploadImage(id: string, tenantId: string, file: UploadedProductImage) {
    await this.findOne(id, tenantId);

    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP product images are allowed');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Product image must be 2MB or smaller');
    }

    const image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.prisma.product.update({
      where: { id },
      data: { image },
      include: { category: true },
    });
  }
}
