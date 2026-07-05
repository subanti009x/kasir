import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, tenantId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        avatar: string | null;
        tenantId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateUserDto, tenantId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        tenantId: string | null;
        createdAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto, tenantId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, tenantId: string): Promise<{
        id: string;
        email: string;
        password: string;
        name: string;
        role: string;
        status: string;
        avatar: string | null;
        tenantId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
