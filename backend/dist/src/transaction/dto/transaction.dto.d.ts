export declare class TransactionItemDto {
    productId: string;
    quantity: number;
    unitPrice?: number;
}
export declare class TransactionPaymentDto {
    method: string;
    amount: number;
    reference?: string;
}
export declare class CheckoutDto {
    items: TransactionItemDto[];
    paymentMethod: string;
    payments?: TransactionPaymentDto[];
    discount?: number;
    discountType?: string;
    customerId?: string;
    amountPaid?: number;
    note?: string;
}
