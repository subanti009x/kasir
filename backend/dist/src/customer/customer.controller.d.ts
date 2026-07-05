import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomerController {
    private readonly customerService;
    constructor(customerService: CustomerService);
    findAll(user: any, search?: string): Promise<({
        transactions: {
            createdAt: Date;
            total: number;
        }[];
        _count: {
            transactions: number;
        };
    } & {
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        transactions: ({
            items: ({
                product: {
                    id: string;
                    name: string;
                    status: string;
                    tenantId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    sku: string;
                    barcode: string | null;
                    purchasePrice: number;
                    sellingPrice: number;
                    stock: number;
                    minStock: number;
                    image: string | null;
                    categoryId: string | null;
                };
            } & {
                id: string;
                subtotal: number;
                quantity: number;
                productId: string;
                unitPrice: number;
                transactionId: string;
            })[];
        } & {
            id: string;
            status: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            paymentMethod: string;
            total: number;
            subtotal: number;
            discount: number;
            tax: number;
            amountPaid: number;
            changeDue: number;
            receiptId: string;
            discountType: string | null;
            note: string | null;
            cashierId: string;
            customerId: string | null;
        })[];
        _count: {
            transactions: number;
        };
    } & {
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
    }>;
    create(dto: CreateCustomerDto, user: any): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
    }>;
    update(id: string, dto: UpdateCustomerDto, user: any): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
        email: string | null;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        phone: string | null;
    }>;
}
