import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoryService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<({
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
    findOne(id: string, tenantId: string): Promise<{
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
    create(dto: CreateCategoryDto, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    }>;
    update(id: string, dto: UpdateCategoryDto, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string | null;
    }>;
}
