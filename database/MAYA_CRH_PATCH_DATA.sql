-- =====================================================
-- MAYA RCH - SCRIPT DE DATOS FALTANTES (PATCH v2)
-- Solo inserta, no borra datos existentes
-- =====================================================

-- =====================================================
-- ROLES (verificar schema: solo tiene rol_id, nombre, descripcion)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM ROL WHERE nombre = 'Administrador')
BEGIN
    INSERT INTO ROL (nombre, descripcion) VALUES
    ('Administrador', 'Usuario con acceso total al sistema'),
    ('RRHH', 'Usuario del departamento de Recursos Humanos'),
    ('Supervisor', 'Supervisor de area con acceso a equipo'),
    ('Empleado', 'Usuario basico empleado');
END
GO

-- =====================================================
-- TURNOS (verificar schema: turno_id, nombre, hora_entrada, hora_salida, tolerancia_minutos, horas_esperadas_dia, activo)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM TURNO)
BEGIN
    INSERT INTO TURNO (nombre, hora_entrada, hora_salida, tolerancia_minutos, horas_esperadas_dia, activo)
    VALUES 
    ('Turno Administrativo', '08:00:00', '17:00:00', 10, 8.00, 1),
    ('Turno Matutino', '07:00:00', '15:00:00', 5, 8.00, 1),
    ('Turno Vespertino', '14:00:00', '22:00:00', 10, 8.00, 1),
    ('Turno Especial', '09:00:00', '13:00:00', 0, 4.00, 1);
END
GO

-- =====================================================
-- TIPOS DE PERMISO (verificar schema: tipo_permiso_id, nombre, requiere_documento, descuenta_vacaciones, activo)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM TIPO_PERMISO)
BEGIN
    INSERT INTO TIPO_PERMISO (nombre, requiere_documento, descuenta_vacaciones, activo)
    VALUES 
    ('Vacaciones', 0, 1, 1),
    ('Permiso Médico', 1, 0, 1),
    ('Día Personal', 0, 1, 1),
    ('Duelo', 1, 0, 1),
    ('Capacitación', 1, 0, 1),
    ('Licencia de Maternidad', 1, 0, 1),
    ('Licencia de Paternidad', 1, 0, 1);
END
GO

-- =====================================================
-- PROYECTOS (verificar schema: proyecto_id, departamento_id, codigo, nombre, descripcion, activo)
-- NO tiene columna 'estado'
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM PROYECTO)
BEGIN
    INSERT INTO PROYECTO (codigo, nombre, descripcion, activo)
    VALUES 
    ('CRH-001', 'Control de RRHH', 'Sistema de gestión de recursos humanos', 1),
    ('MKT-002', 'Portal de Marketing', 'Portal web para campaigns de marketing', 1),
    ('ADM-003', 'Automatización Administrativa', 'Automatización de procesos administrativos', 1);
END
GO

-- =====================================================
-- USUARIOS PARA EMPLEADOS EXISTENTES
-- Password para todos: admin123
-- Hash: $2b$10$4KHvw9IDDVh28GDzaptKmeU62bU.1S4azaNhcL1p7IDty5JXiNYzS
-- =====================================================
DECLARE @pwd VARCHAR(100) = '$2b$10$4KHvw9IDDVh28GDzaptKmeU62bU.1S4azaNhcL1p7IDty5JXiNYzS';

-- Usuario para EMP-TEST-972727550 (empleado_id 4)
IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ttest')
BEGIN
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (4, 'ttest', @pwd, 'activo', GETDATE());
END

-- Usuario para EMP-PUT-35785002 (empleado_id 5)
IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ptest1')
BEGIN
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (5, 'ptest1', @pwd, 'activo', GETDATE());
END

-- Usuario para EMP-PUT-1732147478 (empleado_id 6)
IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ptest2')
BEGIN
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (6, 'ptest2', @pwd, 'activo', GETDATE());
END

-- Usuario para EMP-TEST-1942205798 (empleado_id 7)
IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ttest2')
BEGIN
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (7, 'ttest2', @pwd, 'activo', GETDATE());
END

-- Usuario para EMP-PUT-1013423448 (empleado_id 8)
IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ptest3')
BEGIN
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (8, 'ptest3', @pwd, 'activo', GETDATE());
END
GO

-- =====================================================
-- ROLES PARA USUARIOS (si no existen)
-- Asumiendo: rol_id 1=Administrador, 2=RRHH, 3=Supervisor, 4=Empleado
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = 3)
BEGIN
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (3, 1); -- admin -> Administrador
END

DECLARE @uid4 INT, @uid5 INT, @uid6 INT, @uid7 INT, @uid8 INT;
SELECT @uid4 = usuario_id FROM USUARIO WHERE username = 'ttest';
SELECT @uid5 = usuario_id FROM USUARIO WHERE username = 'ptest1';
SELECT @uid6 = usuario_id FROM USUARIO WHERE username = 'ptest2';
SELECT @uid7 = usuario_id FROM USUARIO WHERE username = 'ttest2';
SELECT @uid8 = usuario_id FROM USUARIO WHERE username = 'ptest3';

IF @uid4 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid4)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid4, 4); -- Empleado

IF @uid5 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid5)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid5, 4); -- Empleado

IF @uid6 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid6)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid6, 4); -- Empleado

IF @uid7 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid7)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid7, 4); -- Empleado

IF @uid8 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid8)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid8, 4); -- Empleado
GO

-- =====================================================
-- PARÁMETROS DEL SISTEMA (verificar si existen)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM PARAMETRO_SISTEMA)
BEGIN
    INSERT INTO PARAMETRO_SISTEMA (usuario_id_actualiza, clave, valor, descripcion, activo)
    VALUES 
    (3, 'LIMITE_DIARIO_HORAS', '12', 'Límite máximo de horas por día', 1),
    (3, 'TOLERANCIA_MARCAJE', '10', 'Tolerancia en minutos para marcaje', 1),
    (3, 'DIAS_VACACIONES_ANUALES', '15', 'Días de vacaciones anuales', 1),
    (3, 'IGSS_LABORAL', '4.83', 'Porcentaje IGSS laboral', 1),
    (3, 'BONIFICACION_DECRETO', '250.00', 'Bonificación decreto 37-2001', 1),
    (3, 'MONEDA_SISTEMA', 'GTQ', 'Moneda del sistema', 1);
END
GO

-- =====================================================
-- REGLA BONO (verificar schema)
-- =====================================================
IF NOT EXISTS (SELECT 1 FROM REGLA_BONO)
BEGIN
    INSERT INTO REGLA_BONO (nombre, activo, min_dias_trabajados, max_tardias, max_faltas, min_horas, vigencia_inicio, vigencia_fin)
    VALUES ('Bono Asistencia Mensual', 1, 20, 2, 0, 160.00, '2026-01-01', '2026-12-31');
END
GO

PRINT 'Patch de datos completado';
GO
