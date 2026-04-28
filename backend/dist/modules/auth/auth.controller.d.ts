import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any): Promise<{
        token: string;
        user: {
            usuarioId: number;
            username: string;
            roles: string[];
            rolId: number;
            empleadoId: number;
            nombreCompleto: string;
            email: string;
            requirePasswordChange: boolean;
        };
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto, req: any): Promise<{
        message: string;
    }>;
    verifyCode(body: {
        email: string;
        code: string;
    }, req: any): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
    getProfile(req: any): Promise<{
        usuarioId: number;
        username: string;
        empleadoId: number;
        nombreCompleto: string;
        email: string;
        roles: string[];
        ultimoLogin: Date;
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        usuarioId: number;
        empleadoId: number;
    }>;
}
