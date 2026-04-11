-- MINIMO: Solo crear usuarios para empleados existentes
DECLARE @pwd VARCHAR(100) = '$2b$10$4KHvw9IDDVh28GDzaptKmeU62bU.1S4azaNhcL1p7IDty5JXiNYzS';

IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ttest')
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (4, 'ttest', @pwd, 'activo', GETDATE());

IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ptest1')
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (5, 'ptest1', @pwd, 'activo', GETDATE());

IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ptest2')
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (6, 'ptest2', @pwd, 'activo', GETDATE());

IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ttest2')
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (7, 'ttest2', @pwd, 'activo', GETDATE());

IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'ptest3')
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado, ultimo_login)
    VALUES (8, 'ptest3', @pwd, 'activo', GETDATE());

-- Asignar rol Empleado (asumiendo rol_id 4 = Empleado)
DECLARE @uid4 INT, @uid5 INT, @uid6 INT, @uid7 INT, @uid8 INT;
SELECT @uid4 = usuario_id FROM USUARIO WHERE username = 'ttest';
SELECT @uid5 = usuario_id FROM USUARIO WHERE username = 'ptest1';
SELECT @uid6 = usuario_id FROM USUARIO WHERE username = 'ptest2';
SELECT @uid7 = usuario_id FROM USUARIO WHERE username = 'ttest2';
SELECT @uid8 = usuario_id FROM USUARIO WHERE username = 'ptest3';

IF @uid4 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid4)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid4, 4);

IF @uid5 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid5)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid5, 4);

IF @uid6 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid6)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid6, 4);

IF @uid7 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid7)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid7, 4);

IF @uid8 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM USUARIO_ROL WHERE usuario_id = @uid8)
    INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@uid8, 4);

PRINT 'Usuarios creados';
GO
