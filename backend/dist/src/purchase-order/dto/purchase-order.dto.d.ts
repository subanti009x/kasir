export declare class PurchaseOrderItemDto {
    productId: string;
    quantity: number;
    unitCost: number;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    note?: string;
    items: PurchaseOrderItemDto[];
}
export declare enum POStatus {
    PENDING = "PENDING",
    RECEIVED = "RECEIVED",
    PARTIAL = "PARTIAL",
    CANCELLED = "CANCELLED"
}
export declare class UpdatePurchaseOrderStatusDto {
    status: POStatus;
}
export declare class ReceivePurchaseOrderDto {
    items: ReceiveItemDto[];
}
export declare class ReceiveItemDto {
    purchaseOrderItemId: string;
    receivedQty: number;
}
