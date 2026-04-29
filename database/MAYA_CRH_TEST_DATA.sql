-- =====================================================
-- MAYA RCH - DATOS DE PRUEBA COMPLETOS
-- =====================================================

-- Tablas a limpiar primero (en orden correcto por FK)
DELETE FROM AUDIT_LOG;
DELETE FROM DECISION_PERMISO;
DELETE FROM VACACION_MOVIMIENTO;
DELETE FROM VACACION_SALDO;
DELETE FROM SOLICITUD_PERMISO;
DELETE FROM REGISTRO_TIEMPO;
DELETE FROM APROBACION_TIEMPO;
DELETE FROM EMPLEADO_PROYECTO;
DELETE FROM EMPLEADO_TURNO;
DELETE FROM REGISTRO_ASISTENCIA;
DELETE FROM KPI_MENSUAL;
DELETE FROM BONO_RESULTADO;
DELETE FROM MOVIMIENTO_PLANILLA;
DELETE FROM PLANILLA_EMPLEADO;
DELETE FROM PERIODO_PLANILLA;
DELETE FROM CONCEPTO_PLANILLA;
DELETE FROM TABLA_ISR;
DELETE FROM PROYECTO;
DELETE FROM TURNO;
DELETE FROM TIPO_PERMISO;
DELETE FROM PARAMETRO_SISTEMA;
DELETE FROM REGLA_BONO;
DELETE FROM USUARIO_ROL;
DELETE FROM USUARIO;
DELETE FROM EMPLEADO;
DELETE FROM ROL;
GO

-- =====================================================
-- ROLES
-- =====================================================
INSERT INTO ROL (nombre, descripcion, activo) VALUES
('Administrador', 'Usuario con acceso total al sistema', 1),
('RRHH', 'Usuario del departamento de Recursos Humanos', 1),
('Supervisor', 'Supervisor de area con acceso a equipo', 1),
('Empleado', 'Usuario basico empleado', 1);
GO

-- =====================================================
-- EMPLEADOS
-- =====================================================
INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, telefono, fecha_ingreso, departamento, puesto, tarifa_hora, supervisor_id, activo)
VALUES 
('EMP-001', 'Carlos', 'Mérida', 'carlos.merida@mayacr.com', '55512345', '2022-01-15', 'Tecnología', 'Desarrollador Sr.', 85.50, NULL, 1),
('EMP-002', 'Lucía', 'Torres', 'lucia.torres@mayacr.com', '55512346', '2021-06-01', 'Operaciones', 'Analista QA', 75.00, NULL, 1),
('EMP-003', 'Mario', 'Paz', 'mario.paz@mayacr.com', '55512347', '2023-02-20', 'Marketing', 'Diseñador UI/UX', 70.00, NULL, 1),
('EMP-004', 'Ana', 'Gómez', 'ana.gomez@mayacr.com', '55512348', '2020-09-10', 'Marketing', 'Especialista MKT', 68.00, NULL, 1),
('EMP-005', 'José Luis', 'Rodríguez', 'jose.rodriguez@mayacr.com', '55512349', '2022-04-15', 'Tecnología', 'Desarrollador Jr.', 55.00, NULL, 1),
('EMP-006', 'Daniela', 'Cruz', 'daniela.cruz@mayacr.com', '55512350', '2021-11-01', 'RRHH', 'Analista RRHH', 72.00, NULL, 1),
('EMP-007', 'Fernando', 'Ruiz', 'fernando.ruiz@mayacr.com', '55512351', '2023-05-20', 'Operaciones', 'Coordinador', 80.00, NULL, 1),
('EMP-008', 'Patricia', 'Hernández', 'patricia.hernandez@mayacr.com', '55512352', '2022-08-10', 'Finanzas', 'Contadora', 78.00, NULL, 1),
('EMP-009', 'María', 'Pérez', 'maria.perez@mayacr.com', '55512353', '2019-03-01', 'RRHH', 'Jefe RRHH', 95.00, NULL, 1),
('EMP-010', 'Edgar', 'García', 'edgar.garcia@mayacr.com', '55512354', '2023-09-15', 'Tecnología', 'Developer', 60.00, NULL, 1),
('EMP-011', 'María', 'García', 'maria.garcia@mayacr.com', '55512355', '2024-01-10', 'Tecnología', 'Analista de Sistemas', 65.00, NULL, 1);

-- Actualizar supervisores (supervisor_id)
UPDATE EMPLEADO SET supervisor_id = 9 WHERE codigo_empleado = 'EMP-006'; -- Daniela reporta a María
UPDATE EMPLEADO SET supervisor_id = 9 WHERE codigo_empleado = 'EMP-002'; -- Lucía reporta a María  
UPDATE EMPLEADO SET supervisor_id = 2 WHERE codigo_empleado = 'EMP-007'; -- Fernando reporta a Lucía
GO

-- =====================================================
-- USUARIOS
-- =====================================================
-- Password: admin123, rrhh123, super123, emp123 (todas hash bcrypt)
DECLARE @pwdAdmin VARCHAR(100) = '$2b$10$rQZ8K7J3vN1x3y5Z8Q9JZuJZK4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0';
DECLARE @pwdRRHH VARCHAR(100) = '$2b$10$rQZ8K7J3vN1x3y5Z8Q9JZuJZK4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0';
DECLARE @pwdSuper VARCHAR(100) = '$2b$10$rQZ8K7J3vN1x3y5Z8Q9JZuJZK4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0';
DECLARE @pwdEmp VARCHAR(100) = '$2b$10$rQZ8K7J3vN1x3y5Z8Q9JZuJZK4K5L6M7N8O9P0Q1R2S3T4U5V6W7X8Y9Z0';

INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
VALUES 
(NULL, 'admin', @pwdAdmin, 'activo', GETDATE()),  -- ID 1
(6, 'rrhh', @pwdRRHH, 'activo', GETDATE()),     -- ID 2 - Daniela Cruz
(2, 'supervisor', @pwdSuper, 'activo', GETDATE()), -- ID 3 - Lucía Torres  
(1, 'cmerida', @pwdEmp, 'activo', GETDATE());    -- ID 4 - Carlos Mérida

-- Asignar roles a usuarios
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (1, 1); -- admin -> Administrador
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (2, 2); -- rrhh -> RRHH
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (2, 3); -- rrhh -> Supervisor (jefe rrhh)
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (3, 3); -- supervisor -> Supervisor
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (4, 4); -- cmerida -> Empleado
GO

-- =====================================================
-- TURNOS
-- =====================================================
INSERT INTO TURNO (codigo, nombre, hora_entrada, hora_salida, tolerancia_minutos, horas_esperadas_dia, dias_laborales, activo)
VALUES 
('T-01', 'Turno Administrativo', '08:00', '17:00', 10, 8, 'L-V', 1),
('T-02', 'Turno Matutino', '07:00', '15:00', 5, 8, 'L-V', 1),
('T-03', 'Turno Vespertino', '14:00', '22:00', 10, 8, 'L-S', 1),
('T-04', 'Turno Especial', '09:00', '13:00', 0, 4, 'L-V', 1);
GO

-- Asignar turnos a empleados
INSERT INTO EMPLEADO_TURNO (empleado_id, turno_id, activo)
VALUES 
(1, 1, 1), -- Carlos - Turno Administrativo
(2, 1, 1), -- Lucía - Turno Administrativo  
(3, 2, 1), -- Mario - Turno Matutino
(4, 2, 1), -- Ana - Turno Matutino
(5, 1, 1), -- José - Turno Administrativo
(6, 1, 1), -- Daniela - Turno Administrativo
(7, 2, 1), -- Fernando - Turno Matutino
(8, 1, 1), -- Patricia - Turno Administrativo
(9, 1, 1), -- María - Turno Administrativo
(10, 1, 1); -- Edgar - Turno Administrativo
GO

-- =====================================================
-- TIPOS DE PERMISO
-- =====================================================
INSERT INTO TIPO_PERMISO (nombre, requiere_documento, descuenta_vacaciones, activo)
VALUES 
('Vacaciones', 0, 1, 1),
('Permiso Médico', 1, 0, 1),
('Día Personal', 0, 1, 1),
('Duelo', 1, 0, 1),
('Capacitación', 1, 0, 1),
('Licencia de Maternidad', 1, 0, 1),
('Licencia de Paternidad', 1, 0, 1);
GO

-- =====================================================
-- SALDOS DE VACACIONES
-- =====================================================
INSERT INTO VACACION_SALDO (empleado_id, dias_disponibles, dias_usados, fecha_corte)
VALUES 
(1, 15, 5, '2026-12-31'), -- Carlos
(2, 18, 3, '2026-12-31'), -- Lucía
(3, 12, 8, '2026-12-31'), -- Mario
(4, 15, 10, '2026-12-31'), -- Ana
(5, 10, 2, '2026-12-31'), -- José
(6, 15, 5, '2026-12-31'), -- Daniela
(7, 10, 4, '2026-12-31'), -- Fernando
(8, 15, 3, '2026-12-31'), -- Patricia
(9, 20, 8, '2026-12-31'), -- María
(10, 8, 0, '2026-12-31'); -- Edgar
GO

-- =====================================================
-- PROYECTOS
-- =====================================================
INSERT INTO PROYECTO (codigo, nombre, descripcion, estado, activo)
VALUES 
('CRH-001', 'Control de RRHH', 'Sistema de gestión de recursos humanos', 'Activo', 1),
('MKT-002', 'Portal de Marketing', 'Portal web para campaigns de marketing', 'Pausado', 1),
('ADM-003', 'Automatización Administrativa', 'Automatización de procesos administrativos', 'Activo', 1),
('LEG-004', 'Cierre Legal', 'Sistema de gestión legal', 'Cerrado', 1),
('FIN-005', 'Sistema Financiero', 'Módulo de gestión financiera', 'Activo', 1);
GO

-- Asignar empleados a proyectos
INSERT INTO EMPLEADO_PROYECTO (empleado_id, proyecto_id, horas_asignadas, activo)
VALUES 
(1, 1, 160, 1), -- Carlos -> CRH
(2, 1, 80, 1),  -- Lucía -> CRH
(3, 2, 120, 1), -- Mario -> MKT
(5, 1, 160, 1), -- José -> CRH
(6, 1, 40, 1),  -- Daniela -> CRH
(7, 3, 80, 1),  -- Fernando -> ADM
(10, 1, 160, 1); -- Edgar -> CRH
GO

-- =====================================================
-- REGISTROS DE ASISTENCIA (últimos 30 días)
-- =====================================================
DECLARE @i INT = 1;
DECLARE @fecha DATE;
DECLARE @empId INT;
DECLARE @horaEntrada VARCHAR(10);
DECLARE @horaSalida VARCHAR(10);
DECLARE @minTardia INT;
DECLARE @horasTrab DECIMAL(4,2);
DECLARE @estado VARCHAR(20);

WHILE @i <= 30
BEGIN
    SET @fecha = DATEADD(DAY, -@i, GETDATE());
    
    -- Solo días laborales (lunes a viernes)
    IF DATEPART(WEEKDAY, @fecha) BETWEEN 2 AND 6
    BEGIN
        -- Carlos (empleado_id = 1)
        SET @empId = 1;
        IF RAND() > 0.1 -- 90% asistencia
        BEGIN
            SET @horaEntrada = CASE WHEN RAND() > 0.2 THEN '07:55' ELSE '08:10' END;
            SET @minTardia = CASE WHEN @horaEntrada = '08:10' THEN 10 ELSE 0 END;
            SET @horaSalida = '17:05';
            SET @horasTrab = 8 + (@minTardia / 60.0);
            SET @estado = 'completada';
            INSERT INTO REGISTRO_ASISTENCIA (empleado_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada, observacion)
            VALUES (@empId, @fecha, @horaEntrada, @horaSalida, @minTardia, @horasTrab, @estado, CASE WHEN @minTardia > 0 THEN CONCAT(@minTardia, ' min retraso') ELSE 'Sin novedades' END);
        END
        
        -- Lucía (empleado_id = 2)
        SET @empId = 2;
        IF RAND() > 0.15
        BEGIN
            SET @horaEntrada = CASE WHEN RAND() > 0.3 THEN '07:58' ELSE '08:15' END;
            SET @minTardia = CASE WHEN @horaEntrada = '08:15' THEN 15 ELSE 0 END;
            SET @horaSalida = '17:00';
            SET @horasTrab = 8 + (@minTardia / 60.0);
            SET @estado = 'completada';
            INSERT INTO REGISTRO_ASISTENCIA (empleado_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada, observacion)
            VALUES (@empId, @fecha, @horaEntrada, @horaSalida, @minTardia, @horasTrab, @estado, CASE WHEN @minTardia > 0 THEN CONCAT(@minTardia, ' min retraso') ELSE 'Sin novedades' END);
        END
        
        -- Mario (empleado_id = 3)
        SET @empId = 3;
        IF RAND() > 0.2
        BEGIN
            SET @horaEntrada = '08:00';
            SET @minTardia = 0;
            SET @horaSalida = CASE WHEN RAND() > 0.3 THEN '15:05' ELSE NULL END;
            SET @horasTrab = CASE WHEN @horaSalida IS NULL THEN 0 ELSE 8 END;
            SET @estado = CASE WHEN @horaSalida IS NULL THEN 'incompleta' ELSE 'completada' END;
            INSERT INTO REGISTRO_ASISTENCIA (empleado_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada, observacion)
            VALUES (@empId, @fecha, @horaEntrada, @horaSalida, @minTardia, @horasTrab, @estado, CASE WHEN @estado = 'incompleta' THEN 'Jornada en curso' ELSE 'Sin novedades' END);
        END
        
        -- María (empleado_id = 9)
        SET @empId = 9;
        IF RAND() > 0.05 -- 95% asistencia
        BEGIN
            SET @horaEntrada = '08:00';
            SET @minTardia = 0;
            SET @horaSalida = '17:00';
            SET @horasTrab = 8;
            SET @estado = 'completada';
            INSERT INTO REGISTRO_ASISTENCIA (empleado_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada, observacion)
            VALUES (@empId, @fecha, @horaEntrada, @horaSalida, @minTardia, @horasTrab, @estado, 'Sin novedades');
        END
    END
    
    SET @i = @i + 1;
END
GO

-- =====================================================
-- REGISTROS DE TIEMPO (TIMESHEETS)
-- =====================================================
INSERT INTO REGISTRO_TIEMPO (empleado_id, proyecto_id, fecha, horas, actividad_descripcion, estado, fecha_registro)
VALUES 
(1, 1, DATEADD(DAY, -5, GETDATE()), 8, 'Desarrollo de módulo de permisos', 'aprobado', GETDATE()),
(1, 1, DATEADD(DAY, -4, GETDATE()), 6, 'Actualización de interfaces', 'aprobado', GETDATE()),
(1, 1, DATEADD(DAY, -3, GETDATE()), 8, 'Integración con API de asistencia', 'pendiente', GETDATE()),
(1, 1, DATEADD(DAY, -2, GETDATE()), 4, 'Revisión de código', 'aprobado', GETDATE()),
(1, 1, DATEADD(DAY, -1, GETDATE()), 8, 'Testing unitario', 'pendiente', GETDATE()),
(2, 1, DATEADD(DAY, -5, GETDATE()), 7, 'Testing de regression', 'aprobado', GETDATE()),
(2, 1, DATEADD(DAY, -4, GETDATE()), 8, 'Ejecución de casos de prueba', 'aprobado', GETDATE()),
(2, 1, DATEADD(DAY, -3, GETDATE()), 8, 'Automatización de tests', 'aprobado', GETDATE()),
(2, 1, DATEADD(DAY, -2, GETDATE()), 6, 'Documentación QA', 'pendiente', GETDATE()),
(3, 2, DATEADD(DAY, -5, GETDATE()), 8, 'Diseño de mockups', 'aprobado', GETDATE()),
(3, 2, DATEADD(DAY, -4, GETDATE()), 8, 'Prototipo interactivo', 'aprobado', GETDATE()),
(3, 2, DATEADD(DAY, -3, GETDATE()), 4, 'Reuniones de revisión', 'aprobado', GETDATE()),
(5, 1, DATEADD(DAY, -5, GETDATE()), 8, 'Desarrollo backend API', 'aprobado', GETDATE()),
(5, 1, DATEADD(DAY, -4, GETDATE()), 8, 'CRUD de empleados', 'aprobado', GETDATE()),
(5, 1, DATEADD(DAY, -3, GETDATE()), 8, 'Auth con JWT', 'pendiente', GETDATE()),
(6, 1, DATEADD(DAY, -5, GETDATE()), 6, 'Gestión de solicitudes', 'aprobado', GETDATE()),
(6, 1, DATEADD(DAY, -4, GETDATE()), 8, 'Procesamiento de permisos', 'aprobado', GETDATE()),
(6, 1, DATEADD(DAY, -3, GETDATE()), 4, 'Reportes RRHH', 'rechazado', GETDATE()),
(10, 1, DATEADD(DAY, -5, GETDATE()), 8, 'Bug fixing', 'aprobado', GETDATE()),
(10, 1, DATEADD(DAY, -4, GETDATE()), 8, 'Code review', 'aprobado', GETDATE()),
(10, 1, DATEADD(DAY, -3, GETDATE()), 6, 'Documentación', 'pendiente', GETDATE());
GO

-- =====================================================
-- SOLICITUDES DE PERMISO
-- =====================================================
INSERT INTO SOLICITUD_PERMISO (empleado_id, tipo_permiso_id, fecha_inicio, fecha_fin, horas_inicio, horas_fin, motivo, estado, fecha_solicitud)
VALUES 
(1, 1, DATEADD(DAY, 10, GETDATE()), DATEADD(DAY, 15, GETDATE()), NULL, NULL, 'Vacaciones de fin de año', 'pendiente', GETDATE()),
(2, 2, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -10, GETDATE()), NULL, NULL, 'Cita médica anual', 'aprobado', DATEADD(DAY, -15, GETDATE())),
(3, 3, DATEADD(DAY, 5, GETDATE()), DATEADD(DAY, 5, GETDATE()), NULL, NULL, 'Trámite personal importante', 'pendiente', GETDATE()),
(4, 2, DATEADD(DAY, -20, GETDATE()), DATEADD(DAY, -20, GETDATE()), NULL, NULL, 'Emergencia familiar', 'aprobado', DATEADD(DAY, -25, GETDATE())),
(5, 1, DATEADD(DAY, 20, GETDATE()), DATEADD(DAY, 22, GETDATE()), NULL, NULL, 'Vacaciones programdas', 'pendiente', GETDATE()),
(6, 1, DATEADD(DAY, 30, GETDATE()), DATEADD(DAY, 35, GETDATE()), NULL, NULL, 'Vacaciones de verano', 'pendiente', GETDATE()),
(10, 3, DATEADD(DAY, 3, GETDATE()), DATEADD(DAY, 3, GETDATE()), NULL, NULL, 'Cumpleaños familiar', 'pendiente', GETDATE());

-- Actualizar saldos de vacaciones usados
UPDATE VACACION_SALDO SET dias_usados = dias_usados + 2 WHERE empleado_id = 2;
UPDATE VACACION_SALDO SET dias_usados = dias_usados + 1 WHERE empleado_id = 4;
GO

-- =====================================================
-- KPIs MENSUALES (últimos 3 meses)
-- =====================================================
DECLARE @emp INT = 1;
DECLARE @mes INT;
DECLARE @anio INT = 2026;
DECLARE @diasEsp INT;
DECLARE @diasTrab INT;
DECLARE @tardias INT;
DECLARE @faltas INT;
DECLARE @horasEsp DECIMAL(5,2);
DECLARE @horasTrab DECIMAL(5,2);
DECLARE @cumplimiento DECIMAL(5,2);
DECLARE @clasif VARCHAR(20);

WHILE @emp <= 10
BEGIN
    SET @mes = 2; -- Febrero
    SET @diasEsp = 20;
    SET @diasTrab = @diasEsp - CAST(RAND() * 3 AS INT);
    SET @tardias = CAST(RAND() * 5 AS INT);
    SET @faltas = CAST(RAND() * 2 AS INT);
    SET @horasEsp = @diasEsp * 8.0;
    SET @horasTrab = @diasTrab * 8.0 - (@tardias * 0.25);
    SET @cumplimiento = (@horasTrab / @horasEsp) * 100;
    SET @clasif = CASE 
        WHEN @cumplimiento >= 95 THEN 'Excelente'
        WHEN @cumplimiento >= 85 THEN 'Bueno'
        WHEN @cumplimiento >= 70 THEN 'Regular'
        ELSE 'Riesgo'
    END;
    
    INSERT INTO KPI_MENSUAL (empleado_id, anio, mes, dias_esperados, dias_trabajados, tardias, faltas, horas_esperadas, horas_trabajadas, cumplimiento_pct, clasificacion)
    VALUES (@emp, @anio, @mes, @diasEsp, @diasTrab, @tardias, @faltas, @horasEsp, @horasTrab, @cumplimiento, @clasif);
    
    SET @mes = 3; -- Marzo
    SET @diasEsp = 21;
    SET @diasTrab = @diasEsp - CAST(RAND() * 2 AS INT);
    SET @tardias = CAST(RAND() * 3 AS INT);
    SET @faltas = CAST(RAND() * 1 AS INT);
    SET @horasEsp = @diasEsp * 8.0;
    SET @horasTrab = @diasTrab * 8.0 - (@tardias * 0.25);
    SET @cumplimiento = (@horasTrab / @horasEsp) * 100;
    SET @clasif = CASE 
        WHEN @cumplimiento >= 95 THEN 'Excelente'
        WHEN @cumplimiento >= 85 THEN 'Bueno'
        WHEN @cumplimiento >= 70 THEN 'Regular'
        ELSE 'Riesgo'
    END;
    
    INSERT INTO KPI_MENSUAL (empleado_id, anio, mes, dias_esperados, dias_trabajados, tardias, faltas, horas_esperadas, horas_trabajadas, cumplimiento_pct, clasificacion)
    VALUES (@emp, @anio, @mes, @diasEsp, @diasTrab, @tardias, @faltas, @horasEsp, @horasTrab, @cumplimiento, @clasif);
    
    SET @emp = @emp + 1;
END
GO

-- =====================================================
-- REGLAS DE BONO
-- =====================================================
INSERT INTO REGLA_BONO (nombre, activo, min_dias_trabajados, max_tardias, max_faltas, min_horas, bonificacion_monto, vigencia_inicio, vigencia_fin)
VALUES 
('Bono Productividad 100%', 1, 20, 0, 0, 160, 1500.00, '2026-01-01', '2026-12-31'),
('Bono Asistencia Mensual', 1, 18, 2, 0, 144, 1000.00, '2026-01-01', '2026-12-31'),
('Bono Extra Productividad', 1, 21, 1, 0, 168, 2000.00, '2026-01-01', '2026-12-31');
GO

-- =====================================================
-- RESULTADOS DE BONO (basado en KPIs)
-- =====================================================
INSERT INTO BONO_RESULTADO (empleado_id, regla_bono_id, anio, mes, elegible, monto_bono, motivo_no_elegible)
SELECT 
    k.empleado_id,
    1, -- Bono Productividad 100%
    k.anio,
    k.mes,
    CASE WHEN k.clasificacion = 'Excelente' AND k.tardias = 0 THEN 1 ELSE 0 END,
    CASE WHEN k.clasificacion = 'Excelente' AND k.tardias = 0 THEN 1500.00 ELSE 0 END,
    CASE WHEN k.clasificacion != 'Excelente' OR k.tardias > 0 THEN 'No cumple criterios' ELSE NULL END
FROM KPI_MENSUAL k
WHERE k.anio = 2026 AND k.mes >= 2;
GO

-- =====================================================
-- CONCEPTOS DE PLANILLA
-- =====================================================
INSERT INTO CONCEPTO_PLANILLA (codigo, nombre, tipo, modo_calculo, base_calculo, activo)
VALUES 
('SALARIO', 'Salario Base', 'ingreso', 'fijo', 'salario', 1),
('BONOPUNT', 'Bonificación Decreto 37-2001', 'ingreso', 'fijo', 'bonificacion', 1),
('BONODESC', 'Bono por Desempeño', 'ingreso', 'variable', 'kpi', 1),
('HORAEXTR', 'Horas Extra', 'ingreso', 'variable', 'horas_extra', 1),
('IGSS', 'IGSS Laboral', 'deduccion', 'porcentaje', 'igss', 1),
('ISR', 'ISR Retenido', 'deduccion', 'variable', 'isr', 1),
('PRESTAMO', 'Préstamo Interno', 'deduccion', 'variable', 'prestamo', 1),
('OTRA', 'Otra Deducción', 'deduccion', 'variable', 'otra', 1);
GO

-- =====================================================
-- TABLA ISR (simplificada para Guatemala 2026)
-- =====================================================
INSERT INTO TABLA_ISR (anio, rango_desde, rango_hasta, cuota_fijo, porcentaje)
VALUES 
(2026, 0, 60000, 0, 0),
(2026, 60001, 90000, 0, 5),
(2026, 90001, 120000, 1500, 7),
(2026, 120001, 180000, 3600, 10),
(2026, 180001, 999999999, 9600, 15);
GO

-- =====================================================
-- PERÍODOS DE PLANILLA
-- =====================================================
INSERT INTO PERIODO_PLANILLA (nombre, fecha_inicio, fecha_fin, tipo, estado)
VALUES 
('Enero 2026', '2026-01-01', '2026-01-31', 'mensual', 'cerrado'),
('Febrero 2026', '2026-02-01', '2026-02-28', 'mensual', 'cerrado'),
('Marzo 2026', '2026-03-01', '2026-03-31', 'mensual', 'abierto');
GO

-- =====================================================
-- PLANILLA EMPLEADO (ejemplo para periodo actual)
-- =====================================================
INSERT INTO PLANILLA_EMPLEADO (periodo_id, empleado_id, tarifa_hora_usada, horas_pagables, monto_bruto, total_bonificaciones, total_deducciones, monto_neto, fecha_calculo)
SELECT 
    3, -- Marzo 2026
    e.empleado_id,
    e.tarifa_hora,
    168, -- horas esperadas mes
    e.tarifa_hora * 168,
    1250.00, -- bonificación promedio
    (e.tarifa_hora * 168 * 0.0483) + 250.00, -- IGSS + ISR estimado
    (e.tarifa_hora * 168) + 1250.00 - ((e.tarifa_hora * 168 * 0.0483) + 250.00)
FROM EMPLEADO e
WHERE e.activo = 1;
GO

-- =====================================================
-- MOVIMIENTOS DE PLANILLA (detalle)
-- =====================================================
INSERT INTO MOVIMIENTO_PLANILLA (planilla_emp_id, concepto_id, tipo, monto, es_manual, usuario_id_regista)
SELECT 
    pe.planilla_emp_id,
    c.concepto_id,
    c.tipo,
    CASE c.codigo 
        WHEN 'SALARIO' THEN e.tarifa_hora * 168
        WHEN 'BONOPUNT' THEN 250.00
        WHEN 'BONODESC' THEN 1000.00
        WHEN 'IGSS' THEN e.tarifa_hora * 168 * 0.0483
        WHEN 'ISR' THEN 250.00
        ELSE 0
    END,
    0,
    1
FROM PLANILLA_EMPLEADO pe
CROSS JOIN CONCEPTO_PLANILLA c
CROSS JOIN EMPLEADO e
WHERE e.empleado_id = pe.empleado_id
AND c.activo = 1
AND c.codigo IN ('SALARIO', 'BONOPUNT', 'BONODESC', 'IGSS', 'ISR');
GO

-- =====================================================
-- PARÁMETROS DEL SISTEMA
-- =====================================================
INSERT INTO PARAMETRO_SISTEMA (clave, valor, descripcion, activo)
VALUES 
('LIMITE_DIARIO_HORAS', '12', 'Límite máximo de horas por día', 1),
('LIMITE_SEMANAL_HORAS_EXTRA', '20', 'Límite semanal de horas extra', 1),
('TOLERANCIA_MARCAJE', '10', 'Tolerancia en minutos para marcaje', 1),
('DIAS_VACACIONES_ANUALES', '15', 'Días de vacaciones anuales', 1),
('DIAS_ADICIONALES_VAC', '2', 'Días adicionales por antigüedad', 1),
('ANIOS_ANTIGUEDAD', '3', 'Años para días adicionales', 1),
('CADUCIDAD_VACACIONES', '31/12', 'Caducidad de vacaciones', 1),
('ANTICIPACION_VACACIONES', '15', 'Días de anticipación para solicitar', 1),
('META_CUMPLIMIENTO', '95', 'Meta de cumplimiento KPI %', 1),
('CLASIFICACION_EXCELENTE', '95', 'Clasificación Excelente KPI %', 1),
('CLASIFICACION_BUENO', '85', 'Clasificación Bueno KPI %', 1),
('CLASIFICACION_REGULAR', '70', 'Clasificación Regular KPI %', 1),
('MAX_TARDIAS_MENSUALES', '3', 'Máximo tardías mensuales para KPI', 1),
('IGSS_LABORAL', '4.83', 'Porcentaje IGSS laboral', 1),
('IGSS_PATRONAL', '12.67', 'Porcentaje IGSS patronal', 1),
('BONIFICACION_DECRETO', '250.00', 'Bonificación decreto 37-2001', 1),
('MONEDA_SISTEMA', 'GTQ', 'Moneda del sistema', 1),
('FORMATO_FECHA', 'DD/MM/YYYY', 'Formato de fecha', 1);
GO

-- =====================================================
-- AUDIT LOG (ejemplos)
-- =====================================================
INSERT INTO AUDIT_LOG (usuario_id, modulo, accion, entidad, entidad_id, detalle, fecha)
VALUES 
(1, 'AUTH', 'LOGIN', 'USUARIO', 1, 'Login exitoso', GETDATE()),
(2, 'PERMISOS', 'CREATE', 'SOLICITUD_PERMISO', 1, 'Nueva solicitud creada', GETDATE()),
(2, 'PERMISOS', 'APPROVE', 'SOLICITUD_PERMISO', 2, 'Solicitud aprobada', GETDATE()),
(1, 'USUARIOS', 'CREATE', 'USUARIO', 4, 'Usuario cmerida creado', GETDATE()),
(3, 'TIMESHEET', 'APPROVE', 'REGISTRO_TIEMPO', 1, 'Timesheet aprobado', GETDATE());
GO

PRINT 'Datos de prueba insertados correctamente';
GO
