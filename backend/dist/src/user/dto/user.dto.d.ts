export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    OWNER = "OWNER",
    CASHIER = "CASHIER"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare class CreateUserDto {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    tenantId?: string;
}
declare const UpdateUserDto_base: import("@nestjs/common").Type<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    status?: UserStatus;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    businessName: string;
    businessSlug: string;
}
export {};
