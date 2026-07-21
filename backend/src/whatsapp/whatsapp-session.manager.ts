import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../notification/notification.gateway';

// Detect serverless environment (Vercel) — Baileys requires persistent
// WebSocket connections and filesystem access which are not available
// in serverless functions.
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Dynamic import helper for ESM-only @whiskeysockets/baileys
// Only called at runtime in non-serverless environments
async function loadBaileys() {
  const baileys = await import('@whiskeysockets/baileys');
  return {
    makeWASocket: baileys.default,
    useMultiFileAuthState: baileys.useMultiFileAuthState,
    DisconnectReason: baileys.DisconnectReason,
    Browsers: baileys.Browsers,
  };
}

export type SessionStatus = 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';

interface ManagedSession {
  socket: any;
  status: SessionStatus;
  retryCount: number;
}

const AUTH_BASE_DIR = join(process.cwd(), 'auth_info_baileys');
const MAX_RECONNECT_RETRIES = 5;

@Injectable()
export class WhatsappSessionManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappSessionManager.name);
  private sessions = new Map<string, ManagedSession>();

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationGateway,
  ) {}

  async onModuleInit() {
    if (IS_SERVERLESS) {
      this.logger.log('Running in serverless environment — WhatsApp sessions disabled');
      return;
    }

    // Restore all connected sessions on startup
    await mkdir(AUTH_BASE_DIR, { recursive: true });
    try {
      const configs = await this.prisma.whatsappConfig.findMany({
        where: { enabled: true, connectionStatus: 'CONNECTED' },
        select: { tenantId: true },
      });
      for (const config of configs) {
        const authDir = join(AUTH_BASE_DIR, config.tenantId);
        if (existsSync(authDir)) {
          this.logger.log(`Restoring WhatsApp session for tenant ${config.tenantId}`);
          this.startSession(config.tenantId).catch((err) =>
            this.logger.error(`Failed to restore session for ${config.tenantId}: ${err.message}`),
          );
        }
      }
    } catch (error) {
      this.logger.warn('Could not restore WhatsApp sessions on startup:', error);
    }
  }

  async onModuleDestroy() {
    for (const [tenantId, session] of this.sessions) {
      try {
        session.socket?.end(undefined);
        this.logger.log(`Closed session for tenant ${tenantId}`);
      } catch { /* ignore */ }
    }
    this.sessions.clear();
  }

  async startSession(tenantId: string): Promise<void> {
    if (IS_SERVERLESS) {
      throw new Error('WhatsApp sessions are not available in serverless environment. Use a persistent server deployment.');
    }

    // If already connected or connecting, skip
    const existing = this.sessions.get(tenantId);
    if (existing?.status === 'CONNECTED' || existing?.status === 'CONNECTING') {
      return;
    }

    // Stop any existing session
    await this.stopSession(tenantId);

    const authDir = join(AUTH_BASE_DIR, tenantId);
    await mkdir(authDir, { recursive: true });

    // Dynamic import of ESM-only Baileys
    const { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = await loadBaileys();
    const pino = (await import('pino')).default;

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('POS Kasir'),
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
    });

    const session: ManagedSession = {
      socket,
      status: 'CONNECTING',
      retryCount: 0,
    };
    this.sessions.set(tenantId, session);

    // Update DB status
    await this.updateDbStatus(tenantId, 'CONNECTING');

    // Handle connection events
    socket.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // QR Code received — broadcast to frontend
        session.status = 'QR_READY';
        await this.updateDbStatus(tenantId, 'QR_READY');
        this.notifications.broadcastWhatsappQR(tenantId, qr);
        this.logger.log(`QR Code generated for tenant ${tenantId}`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        this.logger.warn(
          `Connection closed for tenant ${tenantId} (code: ${statusCode}). Reconnect: ${shouldReconnect}`,
        );

        session.status = 'DISCONNECTED';
        session.socket = null;
        await this.updateDbStatus(tenantId, 'DISCONNECTED', null);
        this.notifications.broadcastWhatsappStatus(tenantId, 'DISCONNECTED');

        if (shouldReconnect && session.retryCount < MAX_RECONNECT_RETRIES) {
          session.retryCount++;
          const delay = Math.min(session.retryCount * 2000, 10000);
          this.logger.log(
            `Reconnecting tenant ${tenantId} in ${delay}ms (attempt ${session.retryCount})`,
          );
          setTimeout(() => this.startSession(tenantId), delay);
        } else if (statusCode === DisconnectReason.loggedOut) {
          this.logger.log(`Tenant ${tenantId} logged out — session cleared`);
          this.sessions.delete(tenantId);
        }
      }

      if (connection === 'open') {
        session.status = 'CONNECTED';
        session.retryCount = 0;

        // Get connected phone number
        const phoneNumber = socket.user?.id?.split(':')[0] || socket.user?.id?.split('@')[0] || null;
        await this.updateDbStatus(tenantId, 'CONNECTED', phoneNumber);
        this.notifications.broadcastWhatsappStatus(tenantId, 'CONNECTED', phoneNumber);
        this.logger.log(`WhatsApp connected for tenant ${tenantId} (phone: ${phoneNumber})`);
      }
    });

    // Save credentials on update
    socket.ev.on('creds.update', saveCreds);
  }

  async stopSession(tenantId: string): Promise<void> {
    const session = this.sessions.get(tenantId);
    if (session) {
      try {
        session.socket?.end(undefined);
      } catch { /* ignore */ }
      this.sessions.delete(tenantId);
    }
    await this.updateDbStatus(tenantId, 'DISCONNECTED', null);
    this.notifications.broadcastWhatsappStatus(tenantId, 'DISCONNECTED');
  }

  async logoutSession(tenantId: string): Promise<void> {
    if (IS_SERVERLESS) {
      throw new Error('WhatsApp sessions are not available in serverless environment.');
    }

    const session = this.sessions.get(tenantId);
    if (session?.socket) {
      try {
        await session.socket.logout();
      } catch { /* ignore */ }
      session.socket = null;
    }
    this.sessions.delete(tenantId);
    await this.updateDbStatus(tenantId, 'DISCONNECTED', null);
    this.notifications.broadcastWhatsappStatus(tenantId, 'DISCONNECTED');

    // Clean up auth files
    const authDir = join(AUTH_BASE_DIR, tenantId);
    try {
      const { rm } = await import('fs/promises');
      await rm(authDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }

  async sendMessage(tenantId: string, phone: string, message: string): Promise<void> {
    if (IS_SERVERLESS) {
      throw new Error('WhatsApp sessions are not available in serverless environment.');
    }

    const session = this.sessions.get(tenantId);
    if (!session?.socket || session.status !== 'CONNECTED') {
      throw new Error('WhatsApp session not connected');
    }

    // Normalize phone number: remove non-digits, convert leading 0 → 62
    const normalizedPhone = phone
      .replace(/[^0-9]/g, '')
      .replace(/^0/, '62');
    const jid = `${normalizedPhone}@s.whatsapp.net`;

    await session.socket.sendMessage(jid, { text: message });
  }

  getStatus(tenantId: string): SessionStatus {
    return this.sessions.get(tenantId)?.status || 'DISCONNECTED';
  }

  isConnected(tenantId: string): boolean {
    return this.getStatus(tenantId) === 'CONNECTED';
  }

  private async updateDbStatus(
    tenantId: string,
    status: SessionStatus,
    connectedPhone?: string | null,
  ): Promise<void> {
    try {
      const data: any = { connectionStatus: status };
      if (connectedPhone !== undefined) {
        data.connectedPhone = connectedPhone;
      }
      await this.prisma.whatsappConfig.updateMany({
        where: { tenantId },
        data,
      });
    } catch {
      // Config may not exist yet — that's fine
    }
  }
}
