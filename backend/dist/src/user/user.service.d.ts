import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        role: string;
        avatar: string | null;
    }[]>;
    findOne(id: string, tenantId: string): Promise<{
        id: string;
        status: string;
        tenantId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        role: string;
        avatar: string | null;
    }>;
    create(dto: CreateUserDto, tenantId: string): Promise<{
        id: string;
        status: string;
        tenantId: string | null;
        createdAt: Date;
        name: string;
        email: string;
        role: string;
    }>;
    update(id: string, dto: UpdateUserDto, tenantId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        role: string;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        status: string;
        tenantId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        password: string;
        role: string;
        avatar: string | null;
    }>;
}
