import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '../../entities/usuario.entity';
import { Empleado } from '../../entities/empleado.entity';
import { Rol } from '../../entities/rol.entity';
import { ResetPasswordToken } from '../../entities/reset-password-token.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ParametroSistema } from '../../entities/parametro-sistema.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private usuarioRepository;
    private empleadoRepository;
    private rolRepository;
    private resetTokenRepository;
    private auditRepository;
    private parametroRepository;
    private jwtService;
    private dataSource;
    constructor(usuarioRepository: Repository<Usuario>, empleadoRepository: Repository<Empleado>, rolRepository: Repository<Rol>, resetTokenRepository: Repository<ResetPasswordToken>, auditRepository: Repository<AuditLog>, parametroRepository: Repository<ParametroSistema>, jwtService: JwtService, dataSource: DataSource);
    private sanitizeString;
    login(loginDto: LoginDto, ip: string): Promise<{
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
    logout(usuarioId: number): Promise<{
        message: string;
    }>;
    forgotPassword(email: string, ip: string, userAgent: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    getProfile(usuarioId: number): Promise<{
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
