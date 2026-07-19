import { LandingPageService } from './landing-page.service';
import { LandingPageCheckoutDto } from './dto/landing-page.dto';
export declare class LandingPageController {
    private readonly service;
    constructor(service: LandingPageService);
    getStoreInfo(req: any): Promise<{
        id: string;
        name: string;
        email: string | null;
        slug: string;
        logo: string | null;
        address: string | null;
        phone: string | null;
        businessHours: string | null;
    }>;
    getProducts(req: any, categoryId?: string, search?: string): Promise<{
        id: string;
        name: string;
        sku: string;
        description: string | null;
        sellingPrice: number;
        stock: number;
        image: string | null;
        category: {
            id: string;
            name: string;
            color: string | null;
        } | null;
    }[]>;
    getCategories(req: any): Promise<{
        id: string;
        _count: {
            products: number;
        };
        name: string;
        description: string | null;
        color: string | null;
    }[]>;
    checkout(req: any, dto: LandingPageCheckoutDto): Promise<{
        success: boolean;
        transaction: {
            id: string;
            receiptId: string;
            subtotal: number;
            tax: number;
            total: number;
            paymentMethod: string;
            amountPaid: number;
            changeDue: number;
            status: string;
            items: ({
                product: {
                    id: string;
                    name: string;
                    sku: string;
                };
            } & {
                id: string;
                subtotal: number;
                quantity: number;
                unitPrice: number;
                transactionId: string;
                productId: string;
            })[];
            customer: {
                id: string;
                name: string;
                phone: string | null;
            } | null;
            createdAt: Date;
        };
    }>;
}
