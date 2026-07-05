import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
      if (!this.connectedClients.has(tenantId)) {
        this.connectedClients.set(tenantId, new Set());
      }
      this.connectedClients.get(tenantId)!.add(client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
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
      message: `Transaction ${transaction.receiptId} completed — ${transaction.paymentMethod}`,
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
}
