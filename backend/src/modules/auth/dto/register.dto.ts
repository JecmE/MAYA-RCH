import { IsString, IsEmail, IsNumber, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  codigoEmpleado: string;

  @IsString()
  nombres: string;

  @IsString()
  apellidos: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsNumber()
  @IsOptional()
  supervisorId?: number;

  @IsNumber()
  @IsOptional()
  departamentoId?: number;

  @IsString()
  @IsOptional()
  puesto?: string;
}
