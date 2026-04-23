-- =====================================================
-- MAYA RCH - USUARIOS DE PRUEBA PARA DESARROLLO
-- =====================================================
-- Password: Test1234 (hash bcrypt)
-- $2b$10$Test1234Test1234Test1234TeTest1234Test1234Test1234Test1234Test

-- Primero limpiar usuarios de prueba si existen
DELETE FROM USUARIO_ROL WHERE usuario_id IN (SELECT usuario_id FROM USUARIO WHERE username IN ('testempleado', 'mariagarcia', 'carlosrodriguez', 'anamartinez'));
DELETE FROM USUARIO WHERE username IN ('testempleado', 'mariagarcia', 'carlosrodriguez', 'anamartinez');

-- Buscar o crear empleados para estos usuarios
DECLARE @empTest INT, @empMaria INT, @empCarlos INT, @empAna INT;

-- Usar empleados existentes o crear si no existen
SELECT TOP 1 @empTest = empleado_id FROM EMPLEADO WHERE activo = 1;
SELECT TOP 1 @empMaria = empleado_id FROM EMPLEADO WHERE activo = 1 AND empleado_id <> @empTest;
SELECT TOP 1 @empCarlos = empleado_id FROM EMPLEADO WHERE activo = 1 AND empleado_id <> @empTest AND empleado_id <> @empMaria;
SELECT TOP 1 @empAna = empleado_id FROM EMPLEADO WHERE activo = 1 AND empleado_id NOT IN (@empTest, @empMaria, @empCarlos);

IF @empMaria IS NULL SET @empMaria = @empTest;
IF @empCarlos IS NULL SET @empCarlos = @empTest;
IF @empAna IS NULL SET @empAna = @empTest;

-- Hash de contraseña: Test1234
DECLARE @pwd VARCHAR(100) = '$2b$10$Test1234Test1234Test1234TeTest1234Test1234Test1234Test1234Te';

-- Insertar usuarios
INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
VALUES 
(@empTest, 'testempleado', @pwd, 'activo', NULL),
(@empMaria, 'mariagarcia', @pwd, 'activo', NULL),
(@empCarlos, 'carlosrodriguez', @pwd, 'activo', NULL),
(@empAna, 'anamartinez', @pwd, 'activo', NULL);

-- Obtener IDs
DECLARE @idTest INT, @idMaria INT, @idCarlos INT, @idAna INT;
SELECT @idTest = usuario_id FROM USUARIO WHERE username = 'testempleado';
SELECT @idMaria = usuario_id FROM USUARIO WHERE username = 'mariagarcia';
SELECT @idCarlos = usuario_id FROM USUARIO WHERE username = 'carlosrodriguez';
SELECT @idAna = usuario_id FROM USUARIO WHERE username = 'anamartinez';

-- Obtener IDs de roles
DECLARE @rolAdmin INT, @rolEmp INT, @rolSuper INT, @rolRRHH INT;
SELECT @rolAdmin = rol_id FROM ROL WHERE nombre = 'Administrador';
SELECT @rolEmp = rol_id FROM ROL WHERE nombre = 'Empleado';
SELECT @rolSuper = rol_id FROM ROL WHERE nombre = 'Supervisor';
SELECT @rolRRHH = rol_id FROM ROL WHERE nombre = 'RRHH';

-- Asignar roles
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@idTest, @rolAdmin);    -- testempleado -> Administrador
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@idMaria, @rolEmp);  -- mariagarcia -> Empleado
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@idCarlos, @rolSuper); -- carlosrodriguez -> Supervisor
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@idAna, @rolRRHH);   -- anamartinez -> RRHH

PRINT 'Usuarios de prueba creados correctamente';
PRINT 'testempleado - Administrador';
PRINT 'mariagarcia - Empleado';
PRINT 'carlosrodriguez - Supervisor';
PRINT 'anamartinez - RRHH';
GO