export declare enum InventoryType {
    STOCK_IN = "STOCK_IN",
    STOCK_OUT = "STOCK_OUT",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare class CreateInventoryLogDto {
    type: InventoryType;
    quantity: number;
    note?: string;
    reference?: string;
    productId: string;
}
