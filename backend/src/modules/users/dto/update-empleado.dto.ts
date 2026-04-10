import { IsString, IsEmail, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateEmpleadoDto {
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

  @IsDateString()
  fechaIngreso: string;

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
}

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
  puesto?: string;

  @IsNumber()
  @IsOptional()
  tarifaHora?: number;

  @IsNumber()
  @IsOptional()
  departamentoId?: number;
}
