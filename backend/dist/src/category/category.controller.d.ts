import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    findAll(user: any): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    })[]>;
    findOne(id: string, user: any): Promise<{
        _count: {
            products: number;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    }>;
    create(dto: CreateCategoryDto, user: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    }>;
    update(id: string, dto: UpdateCategoryDto, user: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    }>;
    remove(id: string, user: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    }>;
}
