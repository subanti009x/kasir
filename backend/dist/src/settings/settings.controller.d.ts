import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from '../tenant/dto/tenant.dto';
export declare class SettingsController {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(user: any): Promise<({
        paymentMethods: {
            id: string;
            name: string;
            tenantId: string;
            enabled: boolean;
        }[];
    } & {
        id: string;
        email: string | null;
        name: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logo: string | null;
        address: string | null;
        phone: string | null;
        businessHours: string | null;
        currency: string;
        taxRate: number;
        receiptTemplate: string | null;
        plan: string;
    }) | null>;
    updateSettings(dto: UpdateTenantDto, user: any): Promise<{
        paymentMethods: {
            id: string;
            name: string;
            tenantId: string;
            enabled: boolean;
        }[];
    } & {
        id: string;
        email: string | null;
        name: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logo: string | null;
        address: string | null;
        phone: string | null;
        businessHours: string | null;
        currency: string;
        taxRate: number;
        receiptTemplate: string | null;
        plan: string;
    }>;
    getPaymentMethods(user: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        enabled: boolean;
    }[]>;
    updatePaymentMethod(dto: {
        id: string;
        enabled: boolean;
    }, user: any): Promise<import("@prisma/client").Prisma.BatchPayload>;
}
