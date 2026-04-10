import { JwtService } from '@nestjs/jwt';
import { Repository, DataSource } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Usuario } from '../../entities/usuario.entity';
import { Empleado } from '../../entities/empleado.entity';
import { ResetPasswordToken } from '../../entities/reset-password-token.entity';
import { AuditLog } from '../../entities/audit-log.entity';
export declare class AuthService {
    private usuarioRepository;
    private empleadoRepository;
    private resetTokenRepository;
    private auditRepository;
    private dataSource;
    private jwtService;
    constructor(usuarioRepository: Repository<Usuario>, empleadoRepository: Repository<Empleado>, resetTokenRepository: Repository<ResetPasswordToken>, auditRepository: Repository<AuditLog>, dataSource: DataSource, jwtService: JwtService);
    login(loginDto: LoginDto, ipAddress: string): Promise<{
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
    logout(usuarioId: number): Promise<{
        message: string;
    }>;
    forgotPassword(email: string, ipAddress: string, userAgent: string): Promise<{
        message: string;
        resetToken?: undefined;
    } | {
        message: string;
        resetToken: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    getProfile(usuarioId: number): Promise<{
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
