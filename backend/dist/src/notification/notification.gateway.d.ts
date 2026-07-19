import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    private connectedClients;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    sendToTenant(tenantId: string, event: string, data: any): void;
    notifyLowStock(tenantId: string, product: {
        id: string;
        name: string;
        stock: number;
        minStock: number;
    }): void;
    notifyTransaction(tenantId: string, transaction: {
        id: string;
        receiptId: string;
        total: number;
        paymentMethod: string;
    }): void;
    notifyPayment(tenantId: string, data: {
        receiptId: string;
        method: string;
        amount: number;
    }): void;
    broadcastWhatsappQR(tenantId: string, qr: string): void;
    broadcastWhatsappStatus(tenantId: string, status: string, connectedPhone?: string | null): void;
    broadcastWhatsappLogUpdate(tenantId: string, log: any): void;
}
