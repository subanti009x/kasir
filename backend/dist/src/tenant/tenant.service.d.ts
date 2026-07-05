import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number, status?: string): Promise<{
        data: ({
            _count: {
                transactions: number;
                users: number;
                products: number;
            };
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        paymentMethods: {
            id: string;
            name: string;
            tenantId: string;
            enabled: boolean;
        }[];
        _count: {
            transactions: number;
            users: number;
            products: number;
            customers: number;
            suppliers: number;
        };
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
    create(dto: CreateTenantDto): Promise<{
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
    update(id: string, dto: UpdateTenantDto): Promise<{
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
    remove(id: string): Promise<{
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
    getStats(): Promise<{
        totalTenants: number;
        activeTenants: number;
        totalUsers: number;
        totalTransactions: number;
        totalRevenue: number;
    }>;
}
