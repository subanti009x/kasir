export declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    TRIAL = "TRIAL"
}
export declare enum TenantPlan {
    BASIC = "BASIC",
    GROWTH = "GROWTH",
    ENTERPRISE = "ENTERPRISE"
}
export declare class CreateTenantDto {
    name: string;
    slug: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    businessHours?: string;
    currency?: string;
    taxRate?: number;
    receiptTemplate?: string;
    plan?: TenantPlan;
}
declare const UpdateTenantDto_base: import("@nestjs/common").Type<Partial<CreateTenantDto>>;
export declare class UpdateTenantDto extends UpdateTenantDto_base {
    status?: TenantStatus;
}
export {};
