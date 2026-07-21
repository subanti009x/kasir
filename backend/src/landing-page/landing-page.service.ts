import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LandingPageCheckoutDto } from './dto/landing-page.dto';
import { NotificationGateway } from '../notification/notification.gateway';
import { AccountingService } from '../accounting/accounting.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class LandingPageService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationGateway,
    private accounting: AccountingService,
    private whatsapp: WhatsappService,
  ) {}

  /**
   * Get public store info for the landing page.
   */
  async getStoreInfo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        businessHours: true,
      },
    });
    if (!tenant) throw new NotFoundException('Store not found');
    return tenant;
  }

  /**
   * Get all active products for the landing page, optionally filtered by category.
   */
  async getProducts(tenantId: string, categoryId?: string, search?: string) {
    const where: any = { tenantId, status: 'ACTIVE' };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        sellingPrice: true,
        image: true,
        stock: true,
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { name: 'asc' },
    });

    return products;
  }

  /**
   * Get all categories for the landing page.
   */
  async getCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Process a checkout from the landing page.
   * Creates/finds customer, then creates a transaction using the same business logic
   * as the internal POS checkout.
   */
  async checkout(tenantId: string, dto: LandingPageCheckoutDto) {
    // Get a cashier for this tenant to assign to the transaction
    // Use the first active cashier or owner
    const systemCashier = await this.prisma.user.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
        role: { in: ['CASHIER', 'OWNER'] },
      },
      orderBy: { role: 'asc' }, // CASHIER first
    });

    if (!systemCashier) {
      throw new BadRequestException('No active cashier found for this store');
    }

    // Find or create customer if info provided
    let customerId: string | null = null;
    if (dto.customerName && dto.customerPhone) {
      let customer = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          phone: dto.customerPhone,
        },
      });

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            name: dto.customerName,
            phone: dto.customerPhone,
            email: dto.customerEmail || null,
            tenantId,
          },
        });
      }

      customerId = customer.id;
    }

    // Process checkout using a transaction to ensure atomicity
    const transaction = await this.prisma.$transaction(async (tx) => {
      // 1. Validate all products and calculate totals
      let subtotal = 0;
      const validatedItems: {
        productId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        product: { id: string; name: string; stock: number; minStock: number };
      }[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId, status: 'ACTIVE' },
        });

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found or inactive`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }

        const unitPrice = product.sellingPrice;
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;
        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          subtotal: itemSubtotal,
          product,
        });
      }

      // 2. Get tenant tax rate
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      const taxRate = tenant?.taxRate || 0;
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;

      const amountPaid = dto.amountPaid || total;
      if (amountPaid < total) {
        throw new BadRequestException('Payment amount is less than transaction total');
      }
      const changeDue = Math.max(amountPaid - total, 0);

      // 3. Generate receipt ID
      const txCount = await tx.transaction.count({ where: { tenantId } });
      const receiptId = `LP-${Date.now().toString(36).toUpperCase()}-${(txCount + 1).toString().padStart(5, '0')}`;

      // 4. Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          tenantId,
          cashierId: systemCashier.id,
          customerId,
          receiptId,
          subtotal,
          discount: 0,
          tax,
          total,
          paymentMethod: dto.paymentMethod,
          amountPaid,
          changeDue,
          status: 'COMPLETED',
          note: dto.note ? `[Landing Page] ${dto.note}` : '[Landing Page] Online booking',
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
          payments: {
            create: [
              {
                method: dto.paymentMethod,
                amount: amountPaid,
              },
            ],
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          payments: true,
          cashier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });

      // 5. Decrement stock and log inventory
      for (const item of validatedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            type: 'STOCK_OUT',
            quantity: -item.quantity,
            note: `Landing Page Sale ${receiptId}`,
            reference: newTransaction.id,
            productId: item.productId,
            tenantId,
          },
        });
      }

      return newTransaction;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    // Fire-and-forget notifications
    this.notifications.notifyTransaction(tenantId, {
      id: transaction.id,
      receiptId: transaction.receiptId,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
    });

    // Generate accounting journal entry (fire-and-forget)
    this.generateSaleAccounting(tenantId, transaction);

    // Send WhatsApp notification to customer (fire-and-forget)
    this.whatsapp.enqueueNotification(tenantId, 'CHECKOUT_SUCCESS', transaction);

    return {
      success: true,
      transaction: {
        id: transaction.id,
        receiptId: transaction.receiptId,
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        amountPaid: transaction.amountPaid,
        changeDue: transaction.changeDue,
        status: transaction.status,
        items: transaction.items,
        customer: transaction.customer,
        createdAt: transaction.createdAt,
      },
    };
  }

  private async generateSaleAccounting(tenantId: string, transaction: any) {
    try {
      const fullTransaction = await this.prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          items: { include: { product: { select: { purchasePrice: true } } } },
        },
      });
      if (fullTransaction) {
        await this.accounting.generateSaleJournal(tenantId, fullTransaction);
      }
    } catch (error) {
      console.error('Failed to generate sale journal entry from landing page:', error);
    }
  }
}
