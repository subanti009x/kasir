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
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_gateway_1 = require("../notification/notification.gateway");
const accounting_service_1 = require("../accounting/accounting.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let TransactionService = class TransactionService {
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
    async checkout(userId, tenantId, dto) {
        const transaction = await this.prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const validatedItems = [];
            if (dto.customerId) {
                const customer = await tx.customer.findFirst({
                    where: { id: dto.customerId, tenantId },
                });
                if (!customer) {
                    throw new common_1.BadRequestException('Customer not found in this tenant');
                }
            }
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
            let discount = 0;
            if (dto.discount && dto.discount > 0) {
                if (dto.discountType === 'PERCENTAGE') {
                    discount = subtotal * (dto.discount / 100);
                }
                else {
                    discount = dto.discount;
                }
            }
            const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
            const taxRate = tenant?.taxRate || 0;
            const taxableAmount = subtotal - discount;
            const tax = taxableAmount * (taxRate / 100);
            const total = taxableAmount + tax;
            const payments = dto.payments?.length
                ? dto.payments
                : [{ method: dto.paymentMethod, amount: dto.amountPaid || total }];
            const amountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
            if (amountPaid < total) {
                throw new common_1.BadRequestException('Payment amount is less than transaction total');
            }
            const changeDue = Math.max(amountPaid - total, 0);
            const paymentMethod = payments.length > 1 ? 'Split Payment' : payments[0].method;
            const txCount = await tx.transaction.count({ where: { tenantId } });
            const receiptId = `REC-${Date.now().toString(36).toUpperCase()}-${(txCount + 1).toString().padStart(5, '0')}`;
            const transaction = await tx.transaction.create({
                data: {
                    tenantId,
                    cashierId: userId,
                    customerId: dto.customerId || null,
                    receiptId,
                    subtotal,
                    discount,
                    discountType: dto.discountType,
                    tax,
                    total,
                    paymentMethod,
                    amountPaid,
                    changeDue,
                    status: 'COMPLETED',
                    note: dto.note,
                    items: {
                        create: validatedItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            subtotal: item.subtotal,
                        })),
                    },
                    payments: {
                        create: payments.map((payment) => ({
                            method: payment.method,
                            amount: payment.amount,
                            reference: payment.reference,
                        })),
                    },
                },
                include: {
                    items: { include: { product: { select: { id: true, name: true, sku: true } } } },
                    payments: true,
                    cashier: { select: { id: true, name: true } },
                    customer: { select: { id: true, name: true } },
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
                        note: `Sale ${receiptId}`,
                        reference: transaction.id,
                        productId: item.productId,
                        tenantId,
                    },
                });
            }
            return transaction;
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
        this.notifications.notifyPayment(tenantId, {
            receiptId: transaction.receiptId,
            method: transaction.paymentMethod,
            amount: transaction.amountPaid,
        });
        const lowStockItems = await this.prisma.product.findMany({
            where: {
                tenantId,
                id: { in: transaction.items.map((item) => item.productId) },
                status: 'ACTIVE',
            },
            select: { id: true, name: true, stock: true, minStock: true },
        });
        lowStockItems
            .filter((product) => product.stock <= product.minStock)
            .forEach((product) => this.notifications.notifyLowStock(tenantId, product));
        this.generateSaleAccounting(tenantId, transaction);
        this.whatsapp.enqueueNotification(tenantId, 'CHECKOUT_SUCCESS', transaction);
        return transaction;
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
            console.error('Failed to generate sale journal entry:', error);
        }
    }
    async findAll(tenantId, page = 1, limit = 20, startDate, endDate) {
        const where = { tenantId };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
        }
        const [data, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                include: {
                    cashier: { select: { id: true, name: true } },
                    customer: { select: { id: true, name: true } },
                    items: { include: { product: { select: { id: true, name: true, sku: true } } } },
                    whatsappLogs: { select: { id: true, status: true, event: true, sentAt: true, errorMessage: true }, orderBy: { createdAt: 'desc' }, take: 1 },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.transaction.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id, tenantId) {
        const transaction = await this.prisma.transaction.findFirst({
            where: { id, tenantId },
            include: {
                cashier: { select: { id: true, name: true } },
                customer: true,
                payments: true,
                items: { include: { product: true } },
                whatsappLogs: { select: { id: true, status: true, event: true, sentAt: true, errorMessage: true, recipientPhone: true, recipientName: true }, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        return transaction;
    }
    async refund(id, tenantId) {
        const transaction = await this.findOne(id, tenantId);
        if (transaction.status === 'REFUNDED') {
            throw new common_1.BadRequestException('Transaction already refunded');
        }
        const refunded = await this.prisma.$transaction(async (tx) => {
            for (const item of transaction.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
                await tx.inventoryLog.create({
                    data: {
                        type: 'STOCK_IN',
                        quantity: item.quantity,
                        note: `Refund ${transaction.receiptId}`,
                        reference: transaction.id,
                        productId: item.productId,
                        tenantId,
                    },
                });
            }
            return tx.transaction.update({
                where: { id },
                data: { status: 'REFUNDED' },
            });
        });
        this.notifications.sendToTenant(tenantId, 'transaction-refunded', {
            type: 'TRANSACTION_REFUNDED',
            message: `Transaction ${transaction.receiptId} refunded`,
            transactionId: transaction.id,
            timestamp: new Date().toISOString(),
        });
        try {
            await this.accounting.generateRefundJournal(tenantId, transaction);
        }
        catch (error) {
            console.error('Failed to generate refund journal entry:', error);
        }
        this.whatsapp.enqueueNotification(tenantId, 'REFUND_SUCCESS', transaction);
        return refunded;
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway,
        accounting_service_1.AccountingService,
        whatsapp_service_1.WhatsappService])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map