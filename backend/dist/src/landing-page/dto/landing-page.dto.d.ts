export declare class LandingPageCheckoutItemDto {
    productId: string;
    quantity: number;
}
export declare class LandingPageCheckoutDto {
    items: LandingPageCheckoutItemDto[];
    paymentMethod: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    amountPaid?: number;
    note?: string;
}
