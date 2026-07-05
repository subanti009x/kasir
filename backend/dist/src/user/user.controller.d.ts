import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAll(user: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        avatar: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getMe(user: any): Promise<{
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
    findOne(id: string, user: any): Promise<{
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
    create(dto: CreateUserDto, user: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        tenantId: string | null;
        createdAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto, user: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, user: any): Promise<{
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
