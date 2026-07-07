import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from '../tenant/dto/tenant.dto';
type UploadedLogo = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};
export declare class SettingsController {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(user: any): Promise<({
        paymentMethods: {
            id: string;
            tenantId: string;
            name: string;
            enabled: boolean;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        slug: string;
        logo: string | null;
        address: string | null;
        phone: string | null;
        businessHours: string | null;
        currency: string;
        taxRate: number;
        receiptTemplate: string | null;
        plan: string;
        planStartedAt: Date;
        planExpiresAt: Date | null;
    }) | null>;
    updateSettings(dto: UpdateTenantDto, user: any): Promise<{
        paymentMethods: {
            id: string;
            tenantId: string;
            name: string;
            enabled: boolean;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        slug: string;
        logo: string | null;
        address: string | null;
        phone: string | null;
        businessHours: string | null;
        currency: string;
        taxRate: number;
        receiptTemplate: string | null;
        plan: string;
        planStartedAt: Date;
        planExpiresAt: Date | null;
    }>;
    uploadLogo(file: UploadedLogo, user: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string | null;
        slug: string;
        logo: string | null;
        address: string | null;
        phone: string | null;
        businessHours: string | null;
        currency: string;
        taxRate: number;
        receiptTemplate: string | null;
        plan: string;
        planStartedAt: Date;
        planExpiresAt: Date | null;
    }>;
    getPaymentMethods(user: any): Promise<{
        id: string;
        tenantId: string;
        name: string;
        enabled: boolean;
    }[]>;
    updatePaymentMethod(dto: {
        id: string;
        enabled: boolean;
    }, user: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
export {};
