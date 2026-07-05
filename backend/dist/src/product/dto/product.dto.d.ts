export declare class CreateProductDto {
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    purchasePrice: number;
    sellingPrice: number;
    stock?: number;
    minStock?: number;
    image?: string;
    categoryId?: string;
    status?: string;
}
declare const UpdateProductDto_base: import("@nestjs/common").Type<Partial<CreateProductDto>>;
export declare class UpdateProductDto extends UpdateProductDto_base {
    status?: string;
}
export {};
