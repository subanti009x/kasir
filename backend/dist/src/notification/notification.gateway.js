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
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let NotificationGateway = class NotificationGateway {
    server;
    connectedClients = new Map();
    handleConnection(client) {
        const tenantId = client.handshake.query.tenantId;
        if (tenantId) {
            client.join(`tenant:${tenantId}`);
            if (!this.connectedClients.has(tenantId)) {
                this.connectedClients.set(tenantId, new Set());
            }
            this.connectedClients.get(tenantId).add(client.id);
        }
    }
    handleDisconnect(client) {
        const tenantId = client.handshake.query.tenantId;
        if (tenantId && this.connectedClients.has(tenantId)) {
            this.connectedClients.get(tenantId).delete(client.id);
        }
    }
    sendToTenant(tenantId, event, data) {
        this.server.to(`tenant:${tenantId}`).emit(event, data);
    }
    notifyLowStock(tenantId, product) {
        this.sendToTenant(tenantId, 'low-stock', {
            type: 'LOW_STOCK',
            message: `${product.name} is low on stock (${product.stock}/${product.minStock})`,
            product,
            timestamp: new Date().toISOString(),
        });
    }
    notifyTransaction(tenantId, transaction) {
        this.sendToTenant(tenantId, 'transaction', {
            type: 'TRANSACTION_COMPLETED',
            message: `Transaction ${transaction.receiptId} completed — ${transaction.paymentMethod}`,
            transaction,
            timestamp: new Date().toISOString(),
        });
    }
    notifyPayment(tenantId, data) {
        this.sendToTenant(tenantId, 'payment', {
            type: 'PAYMENT_RECEIVED',
            message: `Payment received for ${data.receiptId} via ${data.method}`,
            data,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationGateway.prototype, "server", void 0);
exports.NotificationGateway = NotificationGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3001',
            credentials: true,
        },
        namespace: '/notifications',
    })
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map