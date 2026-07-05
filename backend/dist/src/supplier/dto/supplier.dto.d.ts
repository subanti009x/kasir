export declare class CreateSupplierDto {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    contactPerson?: string;
}
declare const UpdateSupplierDto_base: import("@nestjs/common").Type<Partial<CreateSupplierDto>>;
export declare class UpdateSupplierDto extends UpdateSupplierDto_base {
}
export {};
