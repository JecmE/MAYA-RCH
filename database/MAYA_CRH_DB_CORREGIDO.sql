USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'MAYACRHDB')
BEGIN
    ALTER DATABASE MAYACRHDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MAYACRHDB;
END
GO

CREATE DATABASE MAYACRHDB;
GO

USE MAYACRHDB;
GO

CREATE TABLE DEPARTAMENTO (departamento_id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(100) NOT NULL UNIQUE, descripcion VARCHAR(255) NULL, activo BIT DEFAULT 1);
CREATE TABLE ROL (rol_id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(50) NOT NULL UNIQUE, descripcion VARCHAR(255) NULL);
CREATE TABLE TURNO (turno_id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(50) NOT NULL, hora_entrada TIME NOT NULL, hora_salida TIME NOT NULL, tolerancia_minutos INT DEFAULT 10, horas_esperadas_dia DECIMAL(4,2) DEFAULT 8.00, dias VARCHAR(100) DEFAULT 'Lun,Mar,Mie,Jue,Vie', activo BIT DEFAULT 1);
CREATE TABLE TIPO_PERMISO (tipo_permiso_id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(50) NOT NULL, requiere_documento BIT DEFAULT 0, descuenta_vacaciones BIT DEFAULT 0, activo BIT DEFAULT 1);
CREATE TABLE PROYECTO (proyecto_id INT IDENTITY(1,1) PRIMARY KEY, codigo VARCHAR(50) NOT NULL UNIQUE, nombre VARCHAR(100) NOT NULL, descripcion VARCHAR(500) NULL, activo BIT DEFAULT 1);

CREATE TABLE EMPLEADO (
    empleado_id INT IDENTITY(1,1) PRIMARY KEY,
    supervisor_id INT NULL,
    codigo_empleado VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20) NULL,
    fecha_ingreso DATE NOT NULL,
    activo BIT DEFAULT 1,
    departamento VARCHAR(100) NULL,
    puesto VARCHAR(100) NULL,
    tarifa_hora DECIMAL(10,2) DEFAULT 50.00,
    CONSTRAINT FK_EMPLEADO_SUPERVISOR FOREIGN KEY (supervisor_id) REFERENCES EMPLEADO(empleado_id)
);

CREATE TABLE USUARIO (
    usuario_id INT IDENTITY(1,1) PRIMARY KEY,
    empleado_id INT NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    ultimo_login DATETIME NULL,
    ultimo_ip VARCHAR(50) NULL,
    session_version INT DEFAULT 1,
    cambio_password_obligatorio BIT DEFAULT 0,
    FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id)
);

CREATE TABLE USUARIO_ROL (usuario_id INT NOT NULL, rol_id INT NOT NULL, fecha_asignacion DATETIME DEFAULT GETDATE(), PRIMARY KEY (usuario_id, rol_id), FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id), FOREIGN KEY (rol_id) REFERENCES ROL(rol_id));
CREATE TABLE ROL_PERMISO (rol_permiso_id INT IDENTITY(1,1) PRIMARY KEY, rol_id INT NOT NULL, modulo VARCHAR(50) NOT NULL, ver BIT DEFAULT 0, crear BIT DEFAULT 0, editar BIT DEFAULT 0, aprobar BIT DEFAULT 0, exportar BIT DEFAULT 0, administrar BIT DEFAULT 0, FOREIGN KEY (rol_id) REFERENCES ROL(rol_id), UNIQUE (rol_id, modulo));
CREATE TABLE RESET_PASSWORD_TOKEN (reset_id INT IDENTITY(1,1) PRIMARY KEY, usuario_id INT NOT NULL, token_hash VARCHAR(255) NOT NULL, fecha_creacion DATETIME DEFAULT GETDATE(), fecha_expira DATETIME NOT NULL, usado BIT DEFAULT 0, fecha_uso DATETIME NULL, ip_solicitud VARCHAR(45) NULL, FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id));

CREATE TABLE EMPLEADO_TURNO (empleado_turno_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, turno_id INT NOT NULL, fecha_inicio DATE NOT NULL, fecha_fin DATE NULL, activo BIT DEFAULT 1, FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id), FOREIGN KEY (turno_id) REFERENCES TURNO(turno_id));
CREATE TABLE REGISTRO_ASISTENCIA (asistencia_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, empleado_turno_id INT NULL, fecha DATE NOT NULL, hora_entrada_real DATETIME NULL, hora_salida_real DATETIME NULL, minutos_tardia INT DEFAULT 0, horas_trabajadas DECIMAL(6,2) NULL, estado_jornada VARCHAR(20) DEFAULT 'pendiente', observacion VARCHAR(255) NULL, UNIQUE (empleado_id, fecha), FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id));
CREATE TABLE AJUSTE_ASISTENCIA (ajuste_id INT IDENTITY(1,1) PRIMARY KEY, asistencia_id INT NOT NULL, usuario_id INT NOT NULL, campo_modificado VARCHAR(50) NOT NULL, valor_anterior VARCHAR(255) NOT NULL, valor_nuevo VARCHAR(255) NOT NULL, motivo VARCHAR(255) NOT NULL, fecha_hora DATETIME DEFAULT GETDATE(), FOREIGN KEY (asistencia_id) REFERENCES REGISTRO_ASISTENCIA(asistencia_id), FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id));

CREATE TABLE SOLICITUD_PERMISO (solicitud_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, tipo_permiso_id INT NOT NULL, fecha_inicio DATE NOT NULL, fecha_fin DATE NOT NULL, motivo VARCHAR(500) NOT NULL, estado VARCHAR(20) DEFAULT 'pendiente', fecha_solicitud DATETIME DEFAULT GETDATE(), FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id), FOREIGN KEY (tipo_permiso_id) REFERENCES TIPO_PERMISO(tipo_permiso_id));
CREATE TABLE DECISION_PERMISO (decision_id INT IDENTITY(1,1) PRIMARY KEY, solicitud_id INT NOT NULL, usuario_id INT NOT NULL, decision VARCHAR(20) NOT NULL, comentario VARCHAR(255) NOT NULL, fecha_hora DATETIME DEFAULT GETDATE(), FOREIGN KEY (solicitud_id) REFERENCES SOLICITUD_PERMISO(solicitud_id), FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id));
CREATE TABLE ADJUNTO_SOLICITUD (adjunto_id INT IDENTITY(1,1) PRIMARY KEY, solicitud_id INT NOT NULL, nombre_archivo VARCHAR(255) NOT NULL, ruta_url VARCHAR(500) NOT NULL, tipo_mime VARCHAR(100) NOT NULL, fecha_subida DATETIME DEFAULT GETDATE(), FOREIGN KEY (solicitud_id) REFERENCES SOLICITUD_PERMISO(solicitud_id));
CREATE TABLE VACACION_SALDO (saldo_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL UNIQUE, dias_disponibles INT DEFAULT 15, dias_usados INT DEFAULT 0, fecha_corte DATE NOT NULL, FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id));
CREATE TABLE VACACION_MOVIMIENTO (movimiento_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, solicitud_id INT NULL, tipo VARCHAR(20) NOT NULL, dias INT NOT NULL, fecha DATE DEFAULT GETDATE(), comentario VARCHAR(255) NULL, FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id));

CREATE TABLE EMPLEADO_PROYECTO (emp_proy_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, proyecto_id INT NOT NULL, fecha_inicio DATE NOT NULL, activo BIT DEFAULT 1, FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id), FOREIGN KEY (proyecto_id) REFERENCES PROYECTO(proyecto_id));
CREATE TABLE REGISTRO_TIEMPO (tiempo_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, proyecto_id INT NOT NULL, fecha DATE NOT NULL, horas DECIMAL(4,2) NOT NULL, actividad_descripcion VARCHAR(255) NULL, estado VARCHAR(20) DEFAULT 'pendiente', fecha_registro DATETIME DEFAULT GETDATE(), FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id), FOREIGN KEY (proyecto_id) REFERENCES PROYECTO(proyecto_id));
CREATE TABLE APROBACION_TIEMPO (aprobacion_id INT IDENTITY(1,1) PRIMARY KEY, tiempo_id INT NOT NULL, usuario_id INT NOT NULL, decision VARCHAR(20) NOT NULL, comentario VARCHAR(255) NOT NULL, fecha_hora DATETIME DEFAULT GETDATE(), FOREIGN KEY (tiempo_id) REFERENCES REGISTRO_TIEMPO(tiempo_id), FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id));

CREATE TABLE KPI_MENSUAL (kpi_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, anio INT NOT NULL, mes INT NOT NULL, dias_esperados INT NOT NULL, dias_trabajados INT NOT NULL, tardias INT DEFAULT 0, faltas INT DEFAULT 0, horas_esperadas DECIMAL(6,2) NOT NULL, horas_trabajadas DECIMAL(6,2) NOT NULL, cumplimiento_pct DECIMAL(5,2) NOT NULL, clasificacion VARCHAR(20) NULL, observacion VARCHAR(500) NULL, fecha_calculo DATETIME DEFAULT GETDATE(), FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id));
CREATE TABLE REGLA_BONO (regla_bono_id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(100) NOT NULL, monto DECIMAL(10,2) DEFAULT 0, max_tardias INT NULL, max_faltas INT NULL, min_horas DECIMAL(6,2) NULL, min_dias_trabajados INT NULL, vigencia_inicio DATE NOT NULL, activo BIT DEFAULT 1);
CREATE TABLE BONO_RESULTADO (bono_res_id INT IDENTITY(1,1) PRIMARY KEY, empleado_id INT NOT NULL, regla_bono_id INT NOT NULL, anio INT NOT NULL, mes INT NOT NULL, elegible BIT NOT NULL, cumplimiento_pct DECIMAL(5,2) DEFAULT 0, motivo_no_elegible VARCHAR(255) NULL, fecha_calculo DATETIME DEFAULT GETDATE(), FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id), FOREIGN KEY (regla_bono_id) REFERENCES REGLA_BONO(regla_bono_id));
CREATE TABLE PERIODO_PLANILLA (periodo_id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(100) NOT NULL, fecha_inicio DATE NOT NULL, fecha_fin DATE NOT NULL, tipo VARCHAR(20) DEFAULT 'mensual', estado VARCHAR(20) DEFAULT 'abierto');
CREATE TABLE CONCEPTO_PLANILLA (concepto_id INT IDENTITY(1,1) PRIMARY KEY, codigo VARCHAR(20) NOT NULL UNIQUE, nombre VARCHAR(100) NOT NULL, tipo VARCHAR(20) NOT NULL, modo_calculo VARCHAR(30) NOT NULL, base_calculo DECIMAL(10,2) NULL, activo BIT DEFAULT 1);
CREATE TABLE PLANILLA_EMPLEADO (planilla_emp_id INT IDENTITY(1,1) PRIMARY KEY, periodo_id INT NOT NULL, empleado_id INT NOT NULL, monto_bruto DECIMAL(12,2) NOT NULL, total_bonificaciones DECIMAL(12,2) DEFAULT 0, total_deducciones DECIMAL(12,2) DEFAULT 0, monto_neto DECIMAL(12,2) NOT NULL, fecha_calculo DATETIME DEFAULT GETDATE(), FOREIGN KEY (periodo_id) REFERENCES PERIODO_PLANILLA(periodo_id), FOREIGN KEY (empleado_id) REFERENCES EMPLEADO(empleado_id));
CREATE TABLE MOVIMIENTO_PLANILLA (movimiento_id INT IDENTITY(1,1) PRIMARY KEY, planilla_emp_id INT NOT NULL, concepto_id INT NOT NULL, monto DECIMAL(12,2) NOT NULL, tipo VARCHAR(20) NOT NULL, fecha_hora DATETIME DEFAULT GETDATE(), FOREIGN KEY (planilla_emp_id) REFERENCES PLANILLA_EMPLEADO(planilla_emp_id), FOREIGN KEY (concepto_id) REFERENCES CONCEPTO_PLANILLA(concepto_id));
CREATE TABLE TABLA_ISR (isr_id INT IDENTITY(1,1) PRIMARY KEY, anio INT NOT NULL, rango_desde DECIMAL(12,2) NOT NULL, rango_hasta DECIMAL(12,2) NOT NULL, porcentaje DECIMAL(5,2) NOT NULL, cuota_fija DECIMAL(12,2) DEFAULT 0);

CREATE TABLE PARAMETRO_SISTEMA (parametro_id INT IDENTITY(1,1) PRIMARY KEY, usuario_id_actualiza INT NULL, clave VARCHAR(100) NOT NULL UNIQUE, valor VARCHAR(255) NOT NULL, activo BIT DEFAULT 1, fecha_actualizacion DATETIME DEFAULT GETDATE());
CREATE TABLE AUDIT_LOG (audit_id INT IDENTITY(1,1) PRIMARY KEY, usuario_id INT NULL, fecha_hora DATETIME DEFAULT GETDATE(), modulo VARCHAR(50) NOT NULL, accion VARCHAR(50) NOT NULL, entidad VARCHAR(50) NOT NULL, entidad_id INT NULL, detalle VARCHAR(500) NULL, FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id));
CREATE TABLE AVISO (aviso_id INT IDENTITY(1,1) PRIMARY KEY, usuario_id INT NOT NULL, titulo VARCHAR(100) NOT NULL, mensaje VARCHAR(500) NOT NULL, tipo VARCHAR(20) DEFAULT 'info', leido BIT DEFAULT 0, fecha_hora DATETIME DEFAULT GETDATE(), FOREIGN KEY (usuario_id) REFERENCES USUARIO(usuario_id));
CREATE TABLE ACUMULACION (id INT IDENTITY(1,1) PRIMARY KEY, parametro_id INT, vac_dias_por_anio INT, FOREIGN KEY (parametro_id) REFERENCES PARAMETRO_SISTEMA(parametro_id));
CREATE TABLE SOLICITUD_VALIDACIONES (id INT IDENTITY(1,1) PRIMARY KEY, parametro_id INT, vac_min_dias INT, FOREIGN KEY (parametro_id) REFERENCES PARAMETRO_SISTEMA(parametro_id));
CREATE TABLE CALENDARIO_LABORAL (id INT IDENTITY(1,1) PRIMARY KEY, parametro_id INT, vac_cuenta_feriados BIT, FOREIGN KEY (parametro_id) REFERENCES PARAMETRO_SISTEMA(parametro_id));
CREATE TABLE SALDO_CORTES (id INT IDENTITY(1,1) PRIMARY KEY, parametro_id INT, vac_corte_fecha VARCHAR(10), FOREIGN KEY (parametro_id) REFERENCES PARAMETRO_SISTEMA(parametro_id));

INSERT INTO ROL (nombre, descripcion) VALUES ('Administrador', 'Acceso Total'), ('Supervisor', 'Gestión Equipo'), ('RRHH', 'Gestión Planilla'), ('Empleado', 'Básico');
INSERT INTO TURNO (nombre, hora_entrada, hora_salida, tolerancia_minutos) VALUES ('Turno Global', '08:00:00', '17:00:00', 15);
INSERT INTO REGLA_BONO (nombre, monto, max_tardias, max_faltas, min_horas, vigencia_inicio) VALUES ('Bono Puntualidad Mayo', 820.00, 2, 0, 150.00, '2026-05-01');
INSERT INTO PARAMETRO_SISTEMA (clave, valor) VALUES ('tarifa_hora_general', '50'), ('bono_decreto', '250'), ('jwt_expiracion', '60'), ('max_tardias', '4'), ('max_faltas', '1'), ('tiempo_sesion', '480');

DECLARE @pass VARCHAR(255) = '$2b$10$T8ZqT7H6z5P6eL3R6qE8eO.L.8jFfBv5q2S6p6eL3R6qE8eO.L.8j';

INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento) VALUES ('EMP001', 'Jose', 'Perez', 'recovery@mayarch.com', '2026-01-01', 'Gerente', 'Administración');
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'joseperez', @pass);

INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento) VALUES ('EMP002', 'Carlos', 'Rodriguez', 'edgargcabrera1@gmail.com', '2026-01-01', 'Líder TI', 'Tecnología');
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'carlosrodriguez', @pass);

INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento) VALUES ('EMP003', 'Jose', 'Cuevas', 'enriquecuevas@gmail.com', '2026-01-01', 'Coordinador RRHH', 'Recursos Humanos');
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'jcuevas', @pass);

INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento) VALUES ('EMP004', 'Ana', 'Martinez', 'edgargcabrera@gmail.com', '2026-01-01', 'Analista', 'Recursos Humanos');
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'anamartinez', @pass);

DECLARE @cId INT = (SELECT empleado_id FROM EMPLEADO WHERE email = 'edgargcabrera1@gmail.com');
INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento, supervisor_id) VALUES ('EMP005', 'Maria Jose', 'Garcia', 'enrique.cuevas@galileo.edu', '2026-02-01', 'Dev', 'Tecnología', @cId);
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'mariagarcia', @pass);

DECLARE @cuId INT = (SELECT empleado_id FROM EMPLEADO WHERE email = 'enriquecuevas@gmail.com');
INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento, supervisor_id) VALUES ('EMP006', 'Juan', 'Perez', 'juancho@gmail.com', '2026-01-01', 'Supervisor Operativo', 'Operaciones', @cuId);
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'juancho', @pass);

INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento) VALUES ('EMP007', 'Edgar Estuardo', 'Garcia', 'edgar.garcia@test.com', '2026-01-01', 'Auxiliar', 'Operaciones');
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'edgargarcia', @pass);

INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, puesto, departamento) VALUES ('EMP008', 'Admin', 'Maya', 'enriquecuevas200sss0@gmail.com', '2026-01-01', 'Administrador RRHH', 'Recursos Humanos');
INSERT INTO USUARIO (empleado_id, username, password_hash) VALUES (SCOPE_IDENTITY(), 'maya', @pass);

INSERT INTO USUARIO_ROL (usuario_id, rol_id) SELECT u.usuario_id, r.rol_id FROM USUARIO u, ROL r WHERE u.username = 'joseperez' AND r.nombre = 'Administrador';
INSERT INTO USUARIO_ROL (usuario_id, rol_id) SELECT u.usuario_id, r.rol_id FROM USUARIO u, ROL r WHERE u.username IN ('carlosrodriguez', 'juancho') AND r.nombre = 'Supervisor';
INSERT INTO USUARIO_ROL (usuario_id, rol_id) SELECT u.usuario_id, r.rol_id FROM USUARIO u, ROL r WHERE u.username IN ('anamartinez', 'jcuevas', 'maya') AND r.nombre = 'RRHH';
INSERT INTO USUARIO_ROL (usuario_id, rol_id) SELECT u.usuario_id, r.rol_id FROM USUARIO u, ROL r WHERE u.username IN ('mariagarcia', 'edgargarcia') AND r.nombre = 'Empleado';

INSERT INTO ROL_PERMISO (rol_id, modulo, ver, administrar) SELECT rol_id, m, 1, 1 FROM ROL, (VALUES ('Auditoria'),('Configuracion'),('Empleados'),('Permisos'),('Planilla'),('Proyectos'),('Reportes'),('Usuarios')) AS M(m) WHERE nombre = 'Administrador';

DECLARE @f DATE = '2026-05-01';
WHILE @f <= '2026-05-18'
BEGIN
    IF DATEPART(WEEKDAY, @f) NOT IN (1, 7)
    BEGIN
        INSERT INTO REGISTRO_ASISTENCIA (empleado_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada)
        SELECT empleado_id, @f, CAST(@f AS DATETIME) + CAST('08:00:00' AS DATETIME), CAST(@f AS DATETIME) + CAST('17:00:00' AS DATETIME), 0, 9.00, 'completada' FROM EMPLEADO;
    END
    SET @f = DATEADD(DAY, 1, @f);
END
GO
