import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

type UploadedProductImage = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

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
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto, tenantId: string) {
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) throw new NotFoundException('Category not found in this tenant');
    }

    return this.prisma.product.create({
      data: { ...dto, tenantId },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    await this.findOne(id, tenantId);
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) throw new NotFoundException('Category not found in this tenant');
    }
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
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
