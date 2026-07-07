import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    getStats(): Promise<{
        totalTenants: number;
        activeTenants: number;
        totalUsers: number;
        totalTransactions: number;
        totalRevenue: number;
        plans: {
            plan: string;
            count: number;
        }[];
    }>;
    getPlans(): ({
        id: string;
        name: string;
        monthlyPrice: number;
        limits: {
            products: number;
            employees: number;
            registers: number;
        };
        features: string[];
    } | {
        id: string;
        name: string;
        monthlyPrice: number;
        limits: {
            products: null;
            employees: null;
            registers: null;
        };
        features: string[];
    })[];
    findAll(page?: number, limit?: number, status?: string): Promise<{
        data: ({
            _count: {
                transactions: number;
                users: number;
                products: number;
            };
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        _count: {
            transactions: number;
            users: number;
            products: number;
            customers: number;
            suppliers: number;
        };
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
    create(dto: CreateTenantDto): Promise<{
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
    update(id: string, dto: UpdateTenantDto): Promise<{
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
    remove(id: string): Promise<{
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
}
