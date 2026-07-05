export declare class TransactionItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
}
export declare class CheckoutDto {
    items: TransactionItemDto[];
    paymentMethod: string;
    discount?: number;
    discountType?: string;
    customerId?: string;
    amountPaid?: number;
    note?: string;
}
