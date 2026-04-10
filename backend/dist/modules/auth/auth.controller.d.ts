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
            empleadoId: number;
            nombreCompleto: string;
            email: string;
            roles: any;
        };
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto, req: any): Promise<{
        message: string;
        resetToken?: undefined;
    } | {
        message: string;
        resetToken: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
        usuarioId: number;
        username: string;
        empleadoId: number;
        nombreCompleto: string;
        email: string;
        telefono: string;
        puesto: string;
        departamento: string;
        roles: string[];
        ultimoLogin: Date;
    }>;
    register(registerDto: RegisterDto): Promise<{
        message: string;
        usuarioId: number;
        empleadoId: number;
    }>;
}
