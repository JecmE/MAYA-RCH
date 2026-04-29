import { IsString, IsEmail, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class UpdateEmpleadoDto {
  @IsString()
  @IsOptional()
  codigoEmpleado?: string;

  @IsString()
  @IsOptional()
  nombres?: string;

  @IsString()
  @IsOptional()
  apellidos?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsDateString()
  @IsOptional()
  fechaIngreso?: string;

  @IsNumber()
  @IsOptional()
  supervisorId?: number;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  puesto?: string;

  @IsNumber()
  @IsOptional()
  tarifaHora?: number;

  @IsNumber()
  @IsOptional()
  departamentoId?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
