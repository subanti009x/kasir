import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../user/dto/user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            tenantId: string | null;
            tenant: {
                id: string;
                status: string;
                name: string;
                plan: string;
            } | null;
        };
    }>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            tenantId: string;
        };
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
}
