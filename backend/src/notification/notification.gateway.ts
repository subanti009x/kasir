import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getCorsOrigin } from '../config/cors';

type NotificationTokenPayload = {
  sub: string;
  tenantId?: string | null;
};

function getSocketPath(): string {
  const prefix = process.env.BACKEND_ROUTE_PREFIX || (process.env.VERCEL ? '/_/backend' : '');
  return prefix ? `${prefix.replace(/\/$/, '')}/socket.io` : '/socket.io';
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: getCorsOrigin(),
    credentials: true,
  },
  namespace: '/notifications',
  path: getSocketPath(),
  transports: ['websocket', 'polling'],
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (typeof token !== 'string') {
      client.disconnect(true);
      return;
    }

    let payload: NotificationTokenPayload;
    try {
      payload = this.jwtService.verify<NotificationTokenPayload>(token);
    } catch {
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
      this.connectedClients.get(tenantId)!.add(client.id);
      client.emit('notification-ready', {
        type: 'NOTIFICATION_READY',
        message: 'Notification center connected',
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleDisconnect(client: Socket) {
    const tenantId = client.data.tenantId as string | undefined;
    if (tenantId && this.connectedClients.has(tenantId)) {
      this.connectedClients.get(tenantId)!.delete(client.id);
    }
  }

  // Called by other services to push notifications
  sendToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  notifyLowStock(tenantId: string, product: { id: string; name: string; stock: number; minStock: number }) {
    this.sendToTenant(tenantId, 'low-stock', {
      type: 'LOW_STOCK',
      message: `${product.name} is low on stock (${product.stock}/${product.minStock})`,
      product,
      timestamp: new Date().toISOString(),
    });
  }

  notifyTransaction(tenantId: string, transaction: { id: string; receiptId: string; total: number; paymentMethod: string }) {
    this.sendToTenant(tenantId, 'transaction', {
      type: 'TRANSACTION_COMPLETED',
      message: `Transaction ${transaction.receiptId} completed - ${transaction.paymentMethod}`,
      transaction,
      timestamp: new Date().toISOString(),
    });
  }

  notifyPayment(tenantId: string, data: { receiptId: string; method: string; amount: number }) {
    this.sendToTenant(tenantId, 'payment', {
      type: 'PAYMENT_RECEIVED',
      message: `Payment received for ${data.receiptId} via ${data.method}`,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // ── WhatsApp Notification Broadcasts ──────────────────

  broadcastWhatsappQR(tenantId: string, qr: string) {
    this.sendToTenant(tenantId, 'whatsapp-qr', {
      type: 'WHATSAPP_QR',
      qr,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastWhatsappStatus(tenantId: string, status: string, connectedPhone?: string | null) {
    this.sendToTenant(tenantId, 'whatsapp-status', {
      type: 'WHATSAPP_STATUS',
      status,
      connectedPhone: connectedPhone || null,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastWhatsappLogUpdate(tenantId: string, log: any) {
    this.sendToTenant(tenantId, 'whatsapp-log-update', {
      type: 'WHATSAPP_LOG_UPDATE',
      log,
      timestamp: new Date().toISOString(),
    });
  }
}
