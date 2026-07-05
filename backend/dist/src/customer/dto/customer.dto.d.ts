export declare class CreateCustomerDto {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}
declare const UpdateCustomerDto_base: import("@nestjs/common").Type<Partial<CreateCustomerDto>>;
export declare class UpdateCustomerDto extends UpdateCustomerDto_base {
}
export {};
