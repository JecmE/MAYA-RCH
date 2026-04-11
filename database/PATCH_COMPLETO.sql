-- =====================================================
-- MAYA RCH - PATCH COMPLETO DE DATOS
-- Inserta todos los datos faltantes
-- =====================================================

-- =====================================================
-- TURNOS (schema: turno_id, nombre, hora_entrada, hora_salida, tolerancia_minutos, horas_esperadas_dia, activo)
-- =====================================================
INSERT INTO TURNO (nombre, hora_entrada, hora_salida, tolerancia_minutos, horas_esperadas_dia, activo)
VALUES 
('Turno Administrativo', '08:00:00', '17:00:00', 10, 8.00, 1),
('Turno Matutino', '07:00:00', '15:00:00', 5, 8.00, 1),
('Turno Vespertino', '14:00:00', '22:00:00', 10, 8.00, 1),
('Turno Especial', '09:00:00', '13:00:00', 0, 4.00, 1);
GO

-- =====================================================
-- TIPOS DE PERMISO (schema: tipo_permiso_id, nombre, requiere_documento, descuenta_vacaciones, activo)
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
-- PROYECTOS (schema: proyecto_id, departamento_id, codigo, nombre, descripcion, activo)
-- =====================================================
INSERT INTO PROYECTO (codigo, nombre, descripcion, activo)
VALUES 
('CRH-001', 'Control de RRHH', 'Sistema de gestión de recursos humanos', 1),
('MKT-002', 'Portal de Marketing', 'Portal web para campaigns de marketing', 1),
('ADM-003', 'Automatización Administrativa', 'Automatización de procesos administrativos', 1);
GO

-- =====================================================
-- VACACION_SALDO para empleados 4,5,6,7,8 (schema: saldo_id, empleado_id, dias_disponibles, dias_usados, fecha_corte)
-- =====================================================
INSERT INTO VACACION_SALDO (empleado_id, dias_disponibles, dias_usados, fecha_corte)
VALUES 
(4, 15, 0, '2026-12-31'),
(5, 15, 0, '2026-12-31'),
(6, 15, 0, '2026-12-31'),
(7, 15, 0, '2026-12-31'),
(8, 15, 0, '2026-12-31');
GO

-- =====================================================
-- EMPLEADO_TURNO para empleados 4,5,6,7,8 (schema: empleado_turno_id, empleado_id, turno_id, fecha_inicio, fecha_fin, activo)
-- =====================================================
INSERT INTO EMPLEADO_TURNO (empleado_id, turno_id, fecha_inicio, activo)
VALUES 
(4, 1, '2026-01-01', 1),
(5, 1, '2026-01-01', 1),
(6, 1, '2026-01-01', 1),
(7, 1, '2026-01-01', 1),
(8, 1, '2026-01-01', 1);
GO

-- =====================================================
-- EMPLEADO_PROYECTO para algunos empleados (schema: emp_proy_id, empleado_id, proyecto_id, fecha_inicio, fecha_fin, activo)
-- =====================================================
INSERT INTO EMPLEADO_PROYECTO (empleado_id, proyecto_id, fecha_inicio, activo)
VALUES 
(4, 1, '2026-01-01', 1),
(5, 1, '2026-01-01', 1),
(6, 1, '2026-01-01', 1),
(7, 1, '2026-01-01', 1),
(8, 1, '2026-01-01', 1);
GO

-- =====================================================
-- ROLES (schema: rol_id, nombre, descripcion)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM ROL WHERE nombre = 'Administrador')
    INSERT INTO ROL (nombre, descripcion) VALUES ('Administrador', 'Usuario con acceso total al sistema');

IF NOT EXISTS (SELECT 1 FROM ROL WHERE nombre = 'RRHH')
    INSERT INTO ROL (nombre, descripcion) VALUES ('RRHH', 'Usuario del departamento de Recursos Humanos');

IF NOT EXISTS (SELECT 1 FROM ROL WHERE nombre = 'Supervisor')
    INSERT INTO ROL (nombre, descripcion) VALUES ('Supervisor', 'Supervisor de area con acceso a equipo');

IF NOT EXISTS (SELECT 1 FROM ROL WHERE nombre = 'Empleado')
    INSERT INTO ROL (nombre, descripcion) VALUES ('Empleado', 'Usuario basico empleado');
GO

-- =====================================================
-- PARAMETRO_SISTEMA (schema: parametro_id, usuario_id_actualiza, clave, valor, descripcion, activo, fecha_actualizacion, ...)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM PARAMETRO_SISTEMA WHERE clave = 'LIMITE_DIARIO_HORAS')
    INSERT INTO PARAMETRO_SISTEMA (usuario_id_actualiza, clave, valor, descripcion, activo)
    VALUES (3, 'LIMITE_DIARIO_HORAS', '12', 'Límite máximo de horas por día', 1);

IF NOT EXISTS (SELECT 1 FROM PARAMETRO_SISTEMA WHERE clave = 'TOLERANCIA_MARCAJE')
    INSERT INTO PARAMETRO_SISTEMA (usuario_id_actualiza, clave, valor, descripcion, activo)
    VALUES (3, 'TOLERANCIA_MARCAJE', '10', 'Tolerancia en minutos para marcaje', 1);

IF NOT EXISTS (SELECT 1 FROM PARAMETRO_SISTEMA WHERE clave = 'DIAS_VACACIONES_ANUALES')
    INSERT INTO PARAMETRO_SISTEMA (usuario_id_actualiza, clave, valor, descripcion, activo)
    VALUES (3, 'DIAS_VACACIONES_ANUALES', '15', 'Días de vacaciones anuales', 1);

IF NOT EXISTS (SELECT 1 FROM PARAMETRO_SISTEMA WHERE clave = 'IGSS_LABORAL')
    INSERT INTO PARAMETRO_SISTEMA (usuario_id_actualiza, clave, valor, descripcion, activo)
    VALUES (3, 'IGSS_LABORAL', '4.83', 'Porcentaje IGSS laboral', 1);

IF NOT EXISTS (SELECT 1 FROM PARAMETRO_SISTEMA WHERE clave = 'BONIFICACION_DECRETO')
    INSERT INTO PARAMETRO_SISTEMA (usuario_id_actualiza, clave, valor, descripcion, activo)
    VALUES (3, 'BONIFICACION_DECRETO', '250.00', 'Bonificación decreto 37-2001', 1);

IF NOT EXISTS (SELECT 1 FROM PARAMETRO_SISTEMA WHERE clave = 'MONEDA_SISTEMA')
    INSERT INTO PARAMETRO_SISTEMA (usuario_id_actualiza, clave, valor, descripcion, activo)
    VALUES (3, 'MONEDA_SISTEMA', 'GTQ', 'Moneda del sistema', 1);
GO

-- =====================================================
-- REGLA_BONO (schema: regla_bono_id, nombre, activo, min_dias_trabajados, max_tardias, max_faltas, min_horas, vigencia_inicio, vigencia_fin)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM REGLA_BONO WHERE nombre = 'Bono Asistencia Mensual')
    INSERT INTO REGLA_BONO (nombre, activo, min_dias_trabajados, max_tardias, max_faltas, min_horas, vigencia_inicio, vigencia_fin)
    VALUES ('Bono Asistencia Mensual', 1, 20, 2, 0, 160.00, '2026-01-01', '2026-12-31');
GO

PRINT 'Patch completo ejecutado';
GO
