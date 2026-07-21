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
exports.LandingPageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_gateway_1 = require("../notification/notification.gateway");
const accounting_service_1 = require("../accounting/accounting.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let LandingPageService = class LandingPageService {
    prisma;
    notifications;
    accounting;
    whatsapp;
    constructor(prisma, notifications, accounting, whatsapp) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.accounting = accounting;
        this.whatsapp = whatsapp;
    }
    async getStoreInfo(tenantId) {
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
        if (!tenant)
            throw new common_1.NotFoundException('Store not found');
        return tenant;
    }
    async getProducts(tenantId, categoryId, search) {
        const where = { tenantId, status: 'ACTIVE' };
        if (categoryId)
            where.categoryId = categoryId;
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
    async getCategories(tenantId) {
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
    async checkout(tenantId, dto) {
        const systemCashier = await this.prisma.user.findFirst({
            where: {
                tenantId,
                status: 'ACTIVE',
                role: { in: ['CASHIER', 'OWNER'] },
            },
            orderBy: { role: 'asc' },
        });
        if (!systemCashier) {
            throw new common_1.BadRequestException('No active cashier found for this store');
        }
        let customerId = null;
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
        const transaction = await this.prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const validatedItems = [];
            for (const item of dto.items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, tenantId, status: 'ACTIVE' },
                });
                if (!product) {
                    throw new common_1.BadRequestException(`Product ${item.productId} not found or inactive`);
                }
                if (product.stock < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
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
            const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
            const taxRate = tenant?.taxRate || 0;
            const tax = subtotal * (taxRate / 100);
            const total = subtotal + tax;
            const amountPaid = dto.amountPaid || total;
            if (amountPaid < total) {
                throw new common_1.BadRequestException('Payment amount is less than transaction total');
            }
            const changeDue = Math.max(amountPaid - total, 0);
            const txCount = await tx.transaction.count({ where: { tenantId } });
            const receiptId = `LP-${Date.now().toString(36).toUpperCase()}-${(txCount + 1).toString().padStart(5, '0')}`;
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
        this.notifications.notifyTransaction(tenantId, {
            id: transaction.id,
            receiptId: transaction.receiptId,
            total: transaction.total,
            paymentMethod: transaction.paymentMethod,
        });
        this.generateSaleAccounting(tenantId, transaction);
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
    async generateSaleAccounting(tenantId, transaction) {
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
        }
        catch (error) {
            console.error('Failed to generate sale journal entry from landing page:', error);
        }
    }
};
exports.LandingPageService = LandingPageService;
exports.LandingPageService = LandingPageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway,
        accounting_service_1.AccountingService,
        whatsapp_service_1.WhatsappService])
], LandingPageService);
//# sourceMappingURL=landing-page.service.js.map