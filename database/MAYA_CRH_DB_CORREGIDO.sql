CREATE DATABASE MAYA_CRH_DB;
GO

USE MAYA_CRH_DB;
GO

-- =====================================================
-- MAYA CRH - Base de Datos SQL Server (Corregido)
-- Sistema de Control de Asistencia, Permisos y Planilla
-- Versión corregida según diccionario de datos
-- =====================================================

-- =====================================================
-- MÓDULO: SEGURIDAD / AUTENTICACIÓN
-- =====================================================

-- Tabla: DEPARTAMENTO (Catálogo - NO tiene fecha_creacion según diccionario)
CREATE TABLE DEPARTAMENTO (
    departamento_id INT IDENTITY(1,1) NOT NULL,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_DEPARTAMENTO PRIMARY KEY (departamento_id)
);

-- Tabla: EMPLEADO (Datos personales y laborales)
-- NOTA: departamento es VARCHAR(100), NO FK a DEPARTAMENTO
CREATE TABLE EMPLEADO (
    empleado_id INT IDENTITY(1,1) NOT NULL,
    supervisor_id INT NULL,
    codigo_empleado VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20) NULL,
    fecha_ingreso DATE NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    departamento VARCHAR(100) NULL,
    puesto VARCHAR(100) NULL,
    tarifa_hora DECIMAL(10,2) NULL,
    CONSTRAINT PK_EMPLEADO PRIMARY KEY (empleado_id),
    CONSTRAINT FK_EMPLEADO_SUPERVISOR FOREIGN KEY (supervisor_id) 
        REFERENCES EMPLEADO(empleado_id)
);

-- Tabla: USUARIO (Credenciales de acceso - 1:1 con EMPLEADO)
-- NOTA: NO tiene fecha_creacion según diccionario
CREATE TABLE USUARIO (
    usuario_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    ultimo_login DATETIME NULL,
    CONSTRAINT PK_USUARIO PRIMARY KEY (usuario_id),
    CONSTRAINT FK_USUARIO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT CK_USUARIO_ESTADO CHECK (estado IN ('activo', 'bloqueado'))
);

-- Tabla: ROL (Catálogo de roles)
CREATE TABLE ROL (
    rol_id INT IDENTITY(1,1) NOT NULL,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_ROL PRIMARY KEY (rol_id)
);

-- Tabla: USUARIO_ROL (Asignación N:M - Un usuario puede tener múltiples roles)
CREATE TABLE USUARIO_ROL (
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    fecha_asignacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_USUARIO_ROL PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT FK_USUARIO_ROL_USUARIO FOREIGN KEY (usuario_id) 
        REFERENCES USUARIO(usuario_id),
    CONSTRAINT FK_USUARIO_ROL_ROL FOREIGN KEY (rol_id) 
        REFERENCES ROL(rol_id)
);

-- Tabla: RESET_PASSWORD_TOKEN (Gestión de recuperación de contraseña)
-- NOTA: SI tiene fecha_creacion según diccionario
CREATE TABLE RESET_PASSWORD_TOKEN (
    reset_id INT IDENTITY(1,1) NOT NULL,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
    fecha_expira DATETIME NOT NULL,
    usado BIT NOT NULL DEFAULT 0,
    fecha_uso DATETIME NULL,
    ip_solicitud VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    CONSTRAINT PK_RESET_PASSWORD_TOKEN PRIMARY KEY (reset_id),
    CONSTRAINT FK_RESET_PASSWORD_TOKEN_USUARIO FOREIGN KEY (usuario_id) 
        REFERENCES USUARIO(usuario_id)
);

-- =====================================================
-- MÓDULO: RRHH / TURNOS
-- =====================================================

-- Tabla: TURNO (Catálogo de horarios de trabajo)
CREATE TABLE TURNO (
    turno_id INT IDENTITY(1,1) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    tolerancia_minutos INT NOT NULL DEFAULT 0,
    horas_esperadas_dia DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_TURNO PRIMARY KEY (turno_id)
);

-- Tabla: EMPLEADO_TURNO (Historial de asignación de turnos)
CREATE TABLE EMPLEADO_TURNO (
    empleado_turno_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    turno_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_EMPLEADO_TURNO PRIMARY KEY (empleado_turno_id),
    CONSTRAINT FK_EMPLEADO_TURNO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT FK_EMPLEADO_TURNO_TURNO FOREIGN KEY (turno_id) 
        REFERENCES TURNO(turno_id)
);

-- =====================================================
-- MÓDULO: ASISTENCIA
-- =====================================================

-- Tabla: REGISTRO_ASISTENCIA (Marcajes diarios)
-- NOTA: NO tiene fecha_creacion según diccionario
CREATE TABLE REGISTRO_ASISTENCIA (
    asistencia_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    empleado_turno_id INT NULL,
    fecha DATE NOT NULL,
    hora_entrada_real DATETIME NULL,
    hora_salida_real DATETIME NULL,
    minutos_tardia INT NULL DEFAULT 0,
    horas_trabajadas DECIMAL(4,2) NULL,
    estado_jornada VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    observacion VARCHAR(255) NULL,
    CONSTRAINT PK_REGISTRO_ASISTENCIA PRIMARY KEY (asistencia_id),
    CONSTRAINT FK_REGISTRO_ASISTENCIA_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT FK_REGISTRO_ASISTENCIA_TURNO FOREIGN KEY (empleado_turno_id) 
        REFERENCES EMPLEADO_TURNO(empleado_turno_id),
    CONSTRAINT UQ_ASISTENCIA_EMPLEADO_FECHA UNIQUE (empleado_id, fecha),
    CONSTRAINT CK_ASISTENCIA_ESTADO CHECK (estado_jornada IN ('completada', 'incompleta', 'pendiente'))
);

-- Tabla: AJUSTE_ASISTENCIA (Ajustes manuales con trazabilidad)
CREATE TABLE AJUSTE_ASISTENCIA (
    ajuste_id INT IDENTITY(1,1) NOT NULL,
    asistencia_id INT NOT NULL,
    usuario_id INT NOT NULL,
    campo_modificado VARCHAR(50) NOT NULL,
    valor_anterior VARCHAR(255) NOT NULL,
    valor_nuevo VARCHAR(255) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_AJUSTE_ASISTENCIA PRIMARY KEY (ajuste_id),
    CONSTRAINT FK_AJUSTE_ASISTENCIA_ASISTENCIA FOREIGN KEY (asistencia_id) 
        REFERENCES REGISTRO_ASISTENCIA(asistencia_id),
    CONSTRAINT FK_AJUSTE_ASISTENCIA_USUARIO FOREIGN KEY (usuario_id) 
        REFERENCES USUARIO(usuario_id)
);

-- =====================================================
-- MÓDULO: PERMISOS / VACACIONES
-- =====================================================

-- Tabla: TIPO_PERMISO (Catálogo de tipos de ausencia)
CREATE TABLE TIPO_PERMISO (
    tipo_permiso_id INT IDENTITY(1,1) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    requiere_documento BIT NOT NULL DEFAULT 0,
    descuenta_vacaciones BIT NOT NULL DEFAULT 0,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_TIPO_PERMISO PRIMARY KEY (tipo_permiso_id)
);

-- Tabla: SOLICITUD_PERMISO (Solicitudes de permiso/vacaciones)
CREATE TABLE SOLICITUD_PERMISO (
    solicitud_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    tipo_permiso_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    horas_inicio TIME NULL,
    horas_fin TIME NULL,
    motivo VARCHAR(500) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_solicitud DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_SOLICITUD_PERMISO PRIMARY KEY (solicitud_id),
    CONSTRAINT FK_SOLICITUD_PERMISO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT FK_SOLICITUD_PERMISO_TIPO FOREIGN KEY (tipo_permiso_id) 
        REFERENCES TIPO_PERMISO(tipo_permiso_id),
    CONSTRAINT CK_SOLICITUD_ESTADO CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'cancelado'))
);

-- Tabla: DECISION_PERMISO (Aprobaciones/rechazos con comentario)
CREATE TABLE DECISION_PERMISO (
    decision_id INT IDENTITY(1,1) NOT NULL,
    solicitud_id INT NOT NULL,
    usuario_id INT NOT NULL,
    decision VARCHAR(20) NOT NULL,
    comentario VARCHAR(255) NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DECISION_PERMISO PRIMARY KEY (decision_id),
    CONSTRAINT FK_DECISION_PERMISO_SOLICITUD FOREIGN KEY (solicitud_id) 
        REFERENCES SOLICITUD_PERMISO(solicitud_id),
    CONSTRAINT FK_DECISION_PERMISO_USUARIO FOREIGN KEY (usuario_id) 
        REFERENCES USUARIO(usuario_id),
    CONSTRAINT CK_DECISION_TIPO CHECK (decision IN ('aprobado', 'rechazado'))
);

-- Tabla: ADJUNTO_SOLICITUD (Archivos adjuntos a solicitudes)
CREATE TABLE ADJUNTO_SOLICITUD (
    adjunto_id INT IDENTITY(1,1) NOT NULL,
    solicitud_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_url VARCHAR(500) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    fecha_subida DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ADJUNTO_SOLICITUD PRIMARY KEY (adjunto_id),
    CONSTRAINT FK_ADJUNTO_SOLICITUD_SOLICITUD FOREIGN KEY (solicitud_id) 
        REFERENCES SOLICITUD_PERMISO(solicitud_id)
);

-- Tabla: VACACION_SALDO (Saldos de vacaciones por empleado)
CREATE TABLE VACACION_SALDO (
    saldo_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL UNIQUE,
    dias_disponibles INT NOT NULL DEFAULT 0,
    dias_usados INT NOT NULL DEFAULT 0,
    fecha_corte DATE NOT NULL,
    CONSTRAINT PK_VACACION_SALDO PRIMARY KEY (saldo_id),
    CONSTRAINT FK_VACACION_SALDO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id)
);

-- Tabla: VACACION_MOVIMIENTO (Kardex de vacaciones)
CREATE TABLE VACACION_MOVIMIENTO (
    movimiento_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    solicitud_id INT NULL,
    tipo VARCHAR(20) NOT NULL,
    dias INT NOT NULL,
    fecha DATE NOT NULL,
    comentario VARCHAR(255) NULL,
    CONSTRAINT PK_VACACION_MOVIMIENTO PRIMARY KEY (movimiento_id),
    CONSTRAINT FK_VACACION_MOVIMIENTO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT FK_VACACION_MOVIMIENTO_SOLICITUD FOREIGN KEY (solicitud_id) 
        REFERENCES SOLICITUD_PERMISO(solicitud_id),
    CONSTRAINT CK_VACACION_TIPO CHECK (tipo IN ('acumulacion', 'consumo', 'ajuste'))
);

-- =====================================================
-- MÓDULO: PROYECTOS / TIMESHEET
-- =====================================================

-- Tabla: PROYECTO (Catálogo de proyectos)
-- NOTA: NO tiene fecha_creacion según diccionario
CREATE TABLE PROYECTO (
    proyecto_id INT IDENTITY(1,1) NOT NULL,
    departamento_id INT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_PROYECTO PRIMARY KEY (proyecto_id),
    CONSTRAINT FK_PROYECTO_DEPARTAMENTO FOREIGN KEY (departamento_id) 
        REFERENCES DEPARTAMENTO(departamento_id)
);

-- Tabla: EMPLEADO_PROYECTO (Asignación de empleados a proyectos)
CREATE TABLE EMPLEADO_PROYECTO (
    emp_proy_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    proyecto_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_EMPLEADO_PROYECTO PRIMARY KEY (emp_proy_id),
    CONSTRAINT FK_EMPLEADO_PROYECTO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT FK_EMPLEADO_PROYECTO_PROYECTO FOREIGN KEY (proyecto_id) 
        REFERENCES PROYECTO(proyecto_id),
    CONSTRAINT UQ_EMPLEADO_PROYECTO UNIQUE (empleado_id, proyecto_id)
);

-- Tabla: REGISTRO_TIEMPO (Timesheet - Horas por proyecto)
CREATE TABLE REGISTRO_TIEMPO (
    tiempo_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    proyecto_id INT NOT NULL,
    fecha DATE NOT NULL,
    horas DECIMAL(4,2) NOT NULL,
    actividad_descripcion VARCHAR(255) NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    horas_validadas DECIMAL(4,2) NULL,
    CONSTRAINT PK_REGISTRO_TIEMPO PRIMARY KEY (tiempo_id),
    CONSTRAINT FK_REGISTRO_TIEMPO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT FK_REGISTRO_TIEMPO_PROYECTO FOREIGN KEY (proyecto_id) 
        REFERENCES PROYECTO(proyecto_id),
    CONSTRAINT CK_TIEMPO_ESTADO CHECK (estado IN ('pendiente', 'aprobado', 'rechazado'))
);

-- Tabla: APROBACION_TIEMPO (Aprobación de horas timesheet)
CREATE TABLE APROBACION_TIEMPO (
    aprobacion_id INT IDENTITY(1,1) NOT NULL,
    tiempo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    decision VARCHAR(20) NOT NULL,
    comentario VARCHAR(255) NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_APROBACION_TIEMPO PRIMARY KEY (aprobacion_id),
    CONSTRAINT FK_APROBACION_TIEMPO_REGISTRO FOREIGN KEY (tiempo_id) 
        REFERENCES REGISTRO_TIEMPO(tiempo_id),
    CONSTRAINT FK_APROBACION_TIEMPO_USUARIO FOREIGN KEY (usuario_id) 
        REFERENCES USUARIO(usuario_id),
    CONSTRAINT CK_APROBACION_DECISION CHECK (decision IN ('aprobado', 'rechazado'))
);

-- =====================================================
-- MÓDULO: KPIs / BONOS
-- =====================================================

-- Tabla: KPI_MENSUAL (Métricas mensuales por empleado)
CREATE TABLE KPI_MENSUAL (
    kpi_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL,
    dias_esperados INT NOT NULL,
    dias_trabajados INT NOT NULL,
    tardias INT NOT NULL DEFAULT 0,
    faltas INT NOT NULL DEFAULT 0,
    horas_esperadas DECIMAL(6,2) NOT NULL,
    horas_trabajadas DECIMAL(6,2) NOT NULL,
    cumplimiento_pct DECIMAL(5,2) NOT NULL,
    clasificacion VARCHAR(20) NULL,
    fecha_calculo DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_KPI_MENSUAL PRIMARY KEY (kpi_id),
    CONSTRAINT FK_KPI_MENSUAL_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT UQ_KPI_EMPLEADO_PERIODO UNIQUE (empleado_id, anio, mes),
    CONSTRAINT CK_KPI_CLASIFICACION CHECK (clasificacion IN ('Excelente', 'Bueno', 'En observacion', 'En riesgo'))
);

-- Tabla: REGLA_BONO (Reglas de elegibilidad de bonos)
CREATE TABLE REGLA_BONO (
    regla_bono_id INT IDENTITY(1,1) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    min_dias_trabajados INT NULL,
    max_tardias INT NULL,
    max_faltas INT NULL,
    min_horas DECIMAL(6,2) NULL,
    vigencia_inicio DATE NOT NULL,
    vigencia_fin DATE NULL,
    CONSTRAINT PK_REGLA_BONO PRIMARY KEY (regla_bono_id)
);

-- Tabla: BONO_RESULTADO (Resultados de evaluación de bonos)
CREATE TABLE BONO_RESULTADO (
    bono_res_id INT IDENTITY(1,1) NOT NULL,
    empleado_id INT NOT NULL,
    regla_bono_id INT NOT NULL,
    anio INT NOT NULL,
    mes INT NOT NULL,
    elegible BIT NOT NULL,
    motivo_no_elegible VARCHAR(255) NULL,
    fecha_calculo DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_BONO_RESULTADO PRIMARY KEY (bono_res_id),
    CONSTRAINT FK_BONO_RESULTADO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT FK_BONO_RESULTADO_REGLA FOREIGN KEY (regla_bono_id) 
        REFERENCES REGLA_BONO(regla_bono_id),
    CONSTRAINT UQ_BONO_EMPLEADO_PERIODO UNIQUE (empleado_id, regla_bono_id, anio, mes)
);

-- =====================================================
-- MÓDULO: AUDITORÍA
-- =====================================================

-- Tabla: AUDIT_LOG (Bitácora de acciones críticas)
CREATE TABLE AUDIT_LOG (
    audit_id INT IDENTITY(1,1) NOT NULL,
    usuario_id INT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT GETDATE(),
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id INT NULL,
    detalle VARCHAR(500) NULL,
    CONSTRAINT PK_AUDIT_LOG PRIMARY KEY (audit_id),
    CONSTRAINT FK_AUDIT_LOG_USUARIO FOREIGN KEY (usuario_id) 
        REFERENCES USUARIO(usuario_id)
);

-- =====================================================
-- MÓDULO: PARÁMETROS DEL SISTEMA
-- =====================================================

-- Tabla: PARAMETRO_SISTEMA (Parámetros globales)
CREATE TABLE PARAMETRO_SISTEMA (
    parametro_id INT IDENTITY(1,1) NOT NULL,
    usuario_id_actualiza INT NOT NULL,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo BIT NOT NULL DEFAULT 1,
    fecha_actualizacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PARAMETRO_SISTEMA PRIMARY KEY (parametro_id),
    CONSTRAINT FK_PARAMETRO_SISTEMA_USUARIO FOREIGN KEY (usuario_id_actualiza) 
        REFERENCES USUARIO(usuario_id)
);

-- Tabla: ACUMULACION (Parámetros de acumulación de vacaciones)
CREATE TABLE ACUMULACION (
    acumulacion_id INT IDENTITY(1,1) NOT NULL,
    parametro_id INT NOT NULL,
    vac_dias_por_anio INT NULL,
    vac_dias_por_mes DECIMAL(4,2) NULL,
    vac_acumula_desde_fecha_ingreso BIT NULL,
    vac_meses_minimos_para_solicitar INT NULL,
    vac_tope_acumulado_dias INT NULL,
    CONSTRAINT PK_ACUMULACION PRIMARY KEY (acumulacion_id),
    CONSTRAINT FK_ACUMULACION_PARAMETRO FOREIGN KEY (parametro_id) 
        REFERENCES PARAMETRO_SISTEMA(parametro_id)
);

-- Tabla: SOLICITUD_VALIDACIONES (Validaciones para solicitudes)
CREATE TABLE SOLICITUD_VALIDACIONES (
    solicitud_validaciones_id INT IDENTITY(1,1) NOT NULL,
    parametro_id INT NOT NULL,
    vac_min_dias_por_solicitud INT NULL,
    vac_max_dias_por_solicitud INT NULL,
    vac_anticipacion_min_dias INT NULL,
    vac_permite_medio_dia BIT NULL,
    vac_permite_por_horas BIT NULL,
    vac_requiere_aprobacion_supervisor BIT NULL,
    CONSTRAINT PK_SOLICITUD_VALIDACIONES PRIMARY KEY (solicitud_validaciones_id),
    CONSTRAINT FK_SOLICITUD_VALIDACIONES_PARAMETRO FOREIGN KEY (parametro_id) 
        REFERENCES PARAMETRO_SISTEMA(parametro_id)
);

-- Tabla: CALENDARIO_LABORAL (Configuración de calendario)
CREATE TABLE CALENDARIO_LABORAL (
    calendario_laboral_id INT IDENTITY(1,1) NOT NULL,
    parametro_id INT NOT NULL,
    vac_cuenta_sabados BIT NULL,
    vac_cuenta_domingos BIT NULL,
    vac_cuenta_feriados BIT NULL,
    vac_feriados_lista VARCHAR(500) NULL,
    CONSTRAINT PK_CALENDARIO_LABORAL PRIMARY KEY (calendario_laboral_id),
    CONSTRAINT FK_CALENDARIO_LABORAL_PARAMETRO FOREIGN KEY (parametro_id) 
        REFERENCES PARAMETRO_SISTEMA(parametro_id)
);

-- Tabla: SALDO_CORTES (Configuración de cortes de saldo)
CREATE TABLE SALDO_CORTES (
    saldo_cortes_id INT IDENTITY(1,1) NOT NULL,
    parametro_id INT NOT NULL,
    vac_corte_anual_fecha VARCHAR(10) NULL,
    vac_permite_arreo_dias BIT NULL,
    vac_max_arreo_dias INT NULL,
    vac_vence_arreo_en_meses INT NULL,
    CONSTRAINT PK_SALDO_CORTES PRIMARY KEY (saldo_cortes_id),
    CONSTRAINT FK_SALDO_CORTES_PARAMETRO FOREIGN KEY (parametro_id) 
        REFERENCES PARAMETRO_SISTEMA(parametro_id)
);

-- =====================================================
-- MÓDULO: NÓMINA / PLANILLA
-- =====================================================

-- Tabla: PERIODO_PLANILLA (Períodos de cálculo)
-- NOTA: NO tiene fecha_creacion según diccionario
CREATE TABLE PERIODO_PLANILLA (
    periodo_id INT IDENTITY(1,1) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'mensual',
    estado VARCHAR(20) NOT NULL DEFAULT 'abierto',
    CONSTRAINT PK_PERIODO_PLANILLA PRIMARY KEY (periodo_id),
    CONSTRAINT CK_PERIODO_TIPO CHECK (tipo IN ('semanal', 'quincenal', 'mensual')),
    CONSTRAINT CK_PERIODO_ESTADO CHECK (estado IN ('abierto', 'cerrado', 'procesado'))
);

-- Tabla: CONCEPTO_PLANILLA (Catálogo de conceptos de nómina)
CREATE TABLE CONCEPTO_PLANILLA (
    concepto_id INT IDENTITY(1,1) NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    modo_calculo VARCHAR(30) NOT NULL,
    base_calculo DECIMAL(10,2) NULL,
    activo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_CONCEPTO_PLANILLA PRIMARY KEY (concepto_id),
    CONSTRAINT CK_CONCEPTO_TIPO CHECK (tipo IN ('ingreso', 'deduccion')),
    CONSTRAINT CK_CONCEPTO_MODO CHECK (modo_calculo IN ('fijo', 'porcentaje', 'horas'))
);

-- Tabla: PLANILLA_EMPLEADO (Cálculo individual de nómina)
CREATE TABLE PLANILLA_EMPLEADO (
    planilla_emp_id INT IDENTITY(1,1) NOT NULL,
    periodo_id INT NOT NULL,
    empleado_id INT NOT NULL,
    fecha_calculo DATETIME NOT NULL DEFAULT GETDATE(),
    tarifa_hora_usada DECIMAL(10,2) NOT NULL,
    horas_pagables DECIMAL(10,2) NOT NULL,
    monto_bruto DECIMAL(12,2) NOT NULL,
    total_bonificaciones DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deducciones DECIMAL(12,2) NOT NULL DEFAULT 0,
    monto_neto DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_PLANILLA_EMPLEADO PRIMARY KEY (planilla_emp_id),
    CONSTRAINT FK_PLANILLA_EMPLEADO_PERIODO FOREIGN KEY (periodo_id) 
        REFERENCES PERIODO_PLANILLA(periodo_id),
    CONSTRAINT FK_PLANILLA_EMPLEADO_EMPLEADO FOREIGN KEY (empleado_id) 
        REFERENCES EMPLEADO(empleado_id),
    CONSTRAINT UQ_PLANILLA_EMPLEADO_PERIODO UNIQUE (periodo_id, empleado_id)
);

-- Tabla: MOVIMIENTO_PLANILLA (Detalle de movimientos por empleado)
CREATE TABLE MOVIMIENTO_PLANILLA (
    movimiento_id INT IDENTITY(1,1) NOT NULL,
    planilla_emp_id INT NOT NULL,
    concepto_id INT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    usuario_id_regista INT NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT GETDATE(),
    monto DECIMAL(12,2) NOT NULL,
    es_manual BIT NOT NULL DEFAULT 0,
    comentario VARCHAR(255) NULL,
    CONSTRAINT PK_MOVIMIENTO_PLANILLA PRIMARY KEY (movimiento_id),
    CONSTRAINT FK_MOVIMIENTO_PLANILLA_PLANILLA FOREIGN KEY (planilla_emp_id) 
        REFERENCES PLANILLA_EMPLEADO(planilla_emp_id),
    CONSTRAINT FK_MOVIMIENTO_PLANILLA_CONCEPTO FOREIGN KEY (concepto_id) 
        REFERENCES CONCEPTO_PLANILLA(concepto_id),
    CONSTRAINT FK_MOVIMIENTO_PLANILLA_USUARIO FOREIGN KEY (usuario_id_regista) 
        REFERENCES USUARIO(usuario_id),
    CONSTRAINT CK_MOVIMIENTO_TIPO CHECK (tipo IN ('ingreso', 'deduccion'))
);

-- Tabla: TABLA_ISR (Tabla de impuesto sobre la renta)
CREATE TABLE TABLA_ISR (
    isr_id INT IDENTITY(1,1) NOT NULL,
    anio INT NOT NULL,
    rango_desde DECIMAL(12,2) NOT NULL,
    rango_hasta DECIMAL(12,2) NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    cuota_fijo DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_TABLA_ISR PRIMARY KEY (isr_id),
    CONSTRAINT CK_TABLA_ISR_RANGOS CHECK (rango_desde < rango_hasta)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX IX_ASISTENCIA_EMPLEADO_FECHA 
    ON REGISTRO_ASISTENCIA(empleado_id, fecha);

CREATE INDEX IX_ASISTENCIA_FECHA 
    ON REGISTRO_ASISTENCIA(fecha);

CREATE INDEX IX_SOLICITUD_PERMISO_EMPLEADO 
    ON SOLICITUD_PERMISO(empleado_id);

CREATE INDEX IX_SOLICITUD_PERMISO_ESTADO 
    ON SOLICITUD_PERMISO(estado);

CREATE INDEX IX_REGISTRO_TIEMPO_EMPLEADO_FECHA 
    ON REGISTRO_TIEMPO(empleado_id, fecha);

CREATE INDEX IX_REGISTRO_TIEMPO_PROYECTO 
    ON REGISTRO_TIEMPO(proyecto_id);

CREATE INDEX IX_KPI_MENSUAL_EMPLEADO 
    ON KPI_MENSUAL(empleado_id);

CREATE INDEX IX_KPI_MENSUAL_PERIODO 
    ON KPI_MENSUAL(anio, mes);

CREATE INDEX IX_AUDIT_LOG_FECHA 
    ON AUDIT_LOG(fecha_hora);

CREATE INDEX IX_AUDIT_LOG_USUARIO 
    ON AUDIT_LOG(usuario_id);

CREATE INDEX IX_AUDIT_LOG_MODULO 
    ON AUDIT_LOG(modulo);

CREATE INDEX IX_PLANILLA_EMPLEADO_PERIODO 
    ON PLANILLA_EMPLEADO(periodo_id);

-- NOTA: Este índice ya no aplica ya que departamento es VARCHAR, no FK
-- CREATE INDEX IX_EMPLEADO_DEPARTAMENTO ON EMPLEADO(departamento_id);

CREATE INDEX IX_PROYECTO_DEPARTAMENTO 
    ON PROYECTO(departamento_id);

-- =====================================================
-- DATOS SEED - ROLES
-- =====================================================

INSERT INTO ROL (nombre, descripcion) VALUES
('Empleado', 'Usuario básico que marca asistencia y gestiona sus permisos'),
('Supervisor', 'Supervisa equipo, aprueba/rechaza solicitudes'),
('RRHH', 'Gestiona empleados, reportes, planilla y parámetros'),
('Administrador', 'Acceso total al sistema, seguridad y configuración');

-- =====================================================
-- DATOS SEED - DEPARTAMENTOS
-- =====================================================

INSERT INTO DEPARTAMENTO (nombre, descripcion, activo) VALUES
('Recursos Humanos', 'Gestión de personal y nóminas', 1),
('Tecnología', 'Sistemas y tecnología', 1),
('Ventas', 'Comercialización y clientes', 1),
('Administración', 'Finanzas y operaciones', 1),
('Operaciones', 'Producción y logística', 1);

-- =====================================================
-- DATOS SEED - TURNOS
-- =====================================================

INSERT INTO TURNO (nombre, hora_entrada, hora_salida, tolerancia_minutos, horas_esperadas_dia, activo) VALUES
('Matutino', '08:00:00', '17:00:00', 15, 8.00, 1),
('Vespertino', '14:00:00', '22:00:00', 15, 8.00, 1),
('Nocturno', '22:00:00', '06:00:00', 10, 8.00, 1),
('Medio Tiempo', '09:00:00', '13:00:00', 5, 4.00, 1),
('Flexible', '08:30:00', '17:30:00', 30, 8.00, 1);

-- =====================================================
-- DATOS SEED - TIPOS DE PERMISO
-- =====================================================

INSERT INTO TIPO_PERMISO (nombre, requiere_documento, descuenta_vacaciones, activo) VALUES
('Vacaciones', 0, 1, 1),
('Permiso Médico', 1, 0, 1),
('Día Personal', 0, 0, 1),
('Licencia de Maternidad', 1, 0, 1),
('Licencia de Paternidad', 1, 0, 1),
('Fallecimiento familiar', 1, 0, 1),
('Asuntos oficiales', 1, 0, 1);

-- =====================================================
-- DATOS SEED - CONCEPTOS DE PLANILLA
-- =====================================================

INSERT INTO CONCEPTO_PLANILLA (codigo, nombre, tipo, modo_calculo, base_calculo, activo) VALUES
('SALARIO', 'Salario Base', 'ingreso', 'horas', NULL, 1),
('BONOPUNT', 'Bono de Puntualidad', 'ingreso', 'fijo', 100.00, 1),
('BONOPROD', 'Bono de Productividad', 'ingreso', 'porcentaje', 10.00, 1),
('HHEXTRAS', 'Horas Extra', 'ingreso', 'horas', NULL, 1),
('COMISION', 'Comisiones por Ventas', 'ingreso', 'porcentaje', 5.00, 1),
('ISR', 'Impuesto sobre la Renta', 'deduccion', 'porcentaje', NULL, 1),
('IGSS', 'Instituto Guatemalteco de Seguridad Social', 'deduccion', 'porcentaje', 4.83, 1),
('ANTICIPO', 'Anticipo de Salario', 'deduccion', 'fijo', NULL, 1);

-- =====================================================
-- DATOS SEED - TABLA ISR (Ejemplo Guatemala 2026)
-- =====================================================

INSERT INTO TABLA_ISR (anio, rango_desde, rango_hasta, porcentaje, cuota_fijo) VALUES
(2026, 0.01, 5000.00, 5.00, 0.00),
(2026, 5000.01, 10000.00, 7.00, 250.00),
(2026, 10000.01, 20000.00, 10.00, 600.00),
(2026, 20000.01, 35000.00, 15.00, 1600.00),
(2026, 35000.01, 50000.00, 20.00, 3850.00),
(2026, 50000.01, 999999999.00, 25.00, 6850.00);

-- =====================================================
-- CREACIÓN DE USUARIO ADMIN
-- =====================================================

-- Crear empleado admin (sin FK a departamento, solo VARCHAR)
IF NOT EXISTS (SELECT 1 FROM EMPLEADO WHERE email = 'admin@maya.com')
BEGIN
    INSERT INTO EMPLEADO (codigo_empleado, nombres, apellidos, email, fecha_ingreso, activo, puesto, departamento)
    VALUES ('ADMIN001', 'Admin', 'Maya', 'admin@maya.com', GETDATE(), 1, 'Administrador', 'Tecnología');
END

-- Obtener ID del admin
DECLARE @empId INT = (SELECT empleado_id FROM EMPLEADO WHERE email = 'admin@maya.com');

-- Crear usuario admin (password: admin123)
IF NOT EXISTS (SELECT 1 FROM USUARIO WHERE username = 'admin')
BEGIN
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado)
    VALUES (@empId, 'admin', '$2b$10$CH4LezEWux73W.zmvB7EX.gCVCQrKAPUD7TLPTlbBG6cQISHFdOky', 'activo');
END

-- Asignar rol Administrador
DECLARE @userId INT = (SELECT usuario_id FROM USUARIO WHERE username = 'admin');
DECLARE @adminRolId INT = (SELECT rol_id FROM ROL WHERE nombre = 'Administrador');

DELETE FROM USUARIO_ROL WHERE usuario_id = @userId;
INSERT INTO USUARIO_ROL (usuario_id, rol_id) VALUES (@userId, @adminRolId);

-- =====================================================
-- PRINT
-- =====================================================

PRINT 'Base de datos MAYA CRH creada exitosamente';
PRINT 'Total de tablas: 33';
PRINT 'Corregido según diccionario de datos';
PRINT 'Eliminado: fecha_creacion de DEPARTAMENTO, USUARIO, REGISTRO_ASISTENCIA, PERIODO_PLANILLA, PROYECTO';
PRINT 'Corregido: EMPLEADO.departamento_id FK -> EMPLEADO.departamento VARCHAR';
GO
