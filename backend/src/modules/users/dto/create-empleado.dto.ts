import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @MaxLength(20)
  codigoEmpleado: string;

  @IsString()
  @MaxLength(100)
  nombres: string;

  @IsString()
  @MaxLength(100)
  apellidos: string;

  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsDateString()
  fechaIngreso: string;

  @IsOptional()
  @IsInt()
  supervisorId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  departamento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  puesto?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  tarifaHora?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}