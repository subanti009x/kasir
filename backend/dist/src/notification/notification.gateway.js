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
const jwt_1 = require("@nestjs/jwt");
const cors_1 = require("../config/cors");
function getSocketPath() {
    const prefix = process.env.BACKEND_ROUTE_PREFIX || (process.env.VERCEL ? '/_/backend' : '');
    return prefix ? `${prefix.replace(/\/$/, '')}/socket.io` : '/socket.io';
}
let NotificationGateway = class NotificationGateway {
    jwtService;
    server;
    connectedClients = new Map();
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    handleConnection(client) {
        const token = client.handshake.auth?.token;
        if (typeof token !== 'string') {
            client.disconnect(true);
            return;
        }
        let payload;
        try {
            payload = this.jwtService.verify(token);
        }
        catch {
            client.disconnect(true);
            return;
        }
        const tenantId = payload.tenantId;
        if (tenantId) {
            client.data.tenantId = tenantId;
            client.join(`tenant:${tenantId}`);
            if (!this.connectedClients.has(tenantId)) {
                this.connectedClients.set(tenantId, new Set());
            }
            this.connectedClients.get(tenantId).add(client.id);
            client.emit('notification-ready', {
                type: 'NOTIFICATION_READY',
                message: 'Notification center connected',
                timestamp: new Date().toISOString(),
            });
        }
    }
    handleDisconnect(client) {
        const tenantId = client.data.tenantId;
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
            message: `Transaction ${transaction.receiptId} completed - ${transaction.paymentMethod}`,
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
    broadcastWhatsappQR(tenantId, qr) {
        this.sendToTenant(tenantId, 'whatsapp-qr', {
            type: 'WHATSAPP_QR',
            qr,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastWhatsappStatus(tenantId, status, connectedPhone) {
        this.sendToTenant(tenantId, 'whatsapp-status', {
            type: 'WHATSAPP_STATUS',
            status,
            connectedPhone: connectedPhone || null,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastWhatsappLogUpdate(tenantId, log) {
        this.sendToTenant(tenantId, 'whatsapp-log-update', {
            type: 'WHATSAPP_LOG_UPDATE',
            log,
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
            origin: (0, cors_1.getCorsOrigin)(),
            credentials: true,
        },
        namespace: '/notifications',
        path: getSocketPath(),
        transports: ['websocket', 'polling'],
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map