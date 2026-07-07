import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(user: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        role: string;
        avatar: string | null;
    }[]>;
    getMe(user: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    create(dto: CreateUserDto, user: any): Promise<{
        id: string;
        status: string;
        tenantId: string | null;
        createdAt: Date;
        name: string;
        email: string;
        role: string;
    }>;
    update(id: string, dto: UpdateUserDto, user: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        email: string;
        role: string;
    }>;
    remove(id: string, user: any): Promise<{
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
