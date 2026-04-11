const sql = require('mssql');
(async () => {
  const pool = new sql.ConnectionPool({
    server: 'Jec',
    database: 'MAYA_CRH_DB',
    user: 'maya_user',
    password: 'mayacrh',
    options: { encrypt: false },
  });
  await pool.connect();

  const empleadoId = 9;

  // Limpiar datos existentes del empleado
  await pool.query(`DELETE FROM REGISTRO_ASISTENCIA WHERE empleado_id = ${empleadoId}`);
  await pool.query(`DELETE FROM VACACION_SALDO WHERE empleado_id = ${empleadoId}`);
  await pool.query(`DELETE FROM SOLICITUD_PERMISO WHERE empleado_id = ${empleadoId}`);
  await pool.query(`DELETE FROM REGISTRO_TIEMPO WHERE empleado_id = ${empleadoId}`);
  await pool.query(`DELETE FROM KPI_MENSUAL WHERE empleado_id = ${empleadoId}`);
  await pool.query(`DELETE FROM PLANILLA_EMPLEADO WHERE empleado_id = ${empleadoId}`);
  await pool.query(`DELETE FROM EMPLEADO_TURNO WHERE empleado_id = ${empleadoId}`);
  console.log('Datos anteriores limpiados');

  // 1. Asignar turno Matutino al empleado y obtener el ID
  const turnoResult = await pool.query(`
    INSERT INTO EMPLEADO_TURNO (empleado_id, turno_id, fecha_inicio, activo)
    OUTPUT INSERTED.empleado_turno_id
    VALUES (${empleadoId}, 1, GETDATE(), 1)
  `);
  const empleadoTurnoId = turnoResult.recordset[0].empleado_turno_id;
  console.log('1. Turno asignado, empleado_turno_id:', empleadoTurnoId);

  // 2. Insertar asistencia de los últimos 10 días
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    let horaEntrada = '08:05:00';
    let horaSalida = '17:10:00';
    let minutosTardia = 5;
    let horasTrabajadas = 8.5;
    let estadoJornada = 'completada';
    let observacion = null;

    if (i === 0) {
      horaSalida = null;
      estadoJornada = 'pendiente';
      minutosTardia = 0;
      horasTrabajadas = null;
    } else if (i === 2 || i === 5) {
      horaEntrada = null;
      horaSalida = null;
      estadoJornada = 'falta';
      minutosTardia = 0;
      horasTrabajadas = null;
      observacion = 'Falta justificada';
    } else if (i === 3) {
      horaSalida = '15:00:00';
      estadoJornada = 'incompleta';
      horasTrabajadas = 6.5;
    }

    if (horaEntrada) {
      await pool.query(`
        INSERT INTO REGISTRO_ASISTENCIA (empleado_id, empleado_turno_id, fecha, hora_entrada_real, hora_salida_real, minutos_tardia, horas_trabajadas, estado_jornada, observacion)
        VALUES (${empleadoId}, ${empleadoTurnoId}, '${dateStr}', '${horaEntrada}', ${horaSalida ? "'" + horaSalida + "'" : 'NULL'}, ${minutosTardia}, ${horasTrabajadas ? horasTrabajadas : 'NULL'}, '${estadoJornada}', ${observacion ? "'" + observacion + "'" : 'NULL'})
      `);
    }
  }
  console.log('2. Asistencia insertada (10 días)');

  // 3. Insertar saldo de vacaciones
  await pool.query(`
    INSERT INTO VACACION_SALDO (empleado_id, dias_disponibles, dias_usados, fecha_corte)
    VALUES (${empleadoId}, 10, 2, GETDATE())
  `);
  console.log('3. Saldo vacaciones insertado');

  // 4. Insertar solicitudes de permiso
  await pool.query(`
    INSERT INTO SOLICITUD_PERMISO (empleado_id, tipo_permiso_id, fecha_inicio, fecha_fin, motivo, estado, fecha_solicitud)
    VALUES 
      (${empleadoId}, 1, '2026-04-20', '2026-04-25', 'Vacaciones de Semana Santa', 'aprobado', DATEADD(day, -5, GETDATE())),
      (${empleadoId}, 2, '2026-03-15', '2026-03-16', 'Consulta médica', 'aprobado', DATEADD(day, -30, GETDATE())),
      (${empleadoId}, 3, '2026-04-10', '2026-04-10', 'Asunto personal', 'pendiente', GETDATE())
  `);
  console.log('4. Solicitudes de permiso insertadas');

  // 5. Insertar registros de tiempo (timesheet)
  const proyectoId = 1;
  for (let i = 0; i < 8; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    await pool.query(`
      INSERT INTO REGISTRO_TIEMPO (empleado_id, proyecto_id, fecha, horas, actividad_descripcion, estado, fecha_registro, horas_validadas)
      VALUES (${empleadoId}, ${proyectoId}, '${dateStr}', 8, 'Desarrollo de funcionalidades', 'aprobado', GETDATE(), 8)
    `);
  }
  console.log('5. Timesheet insertado (8 días)');

  // 6. Insertar KPIs mensuales
  const kpiData = [
    {
      anio: 2026,
      mes: 1,
      dias_esperados: 22,
      dias_trabajados: 20,
      tardias: 2,
      faltas: 0,
      horas_esperadas: 176,
      horas_trabajadas: 165,
      cumplimiento: 93.75,
      clasificacion: 'Bueno',
    },
    {
      anio: 2026,
      mes: 2,
      dias_esperados: 20,
      dias_trabajados: 19,
      tardias: 1,
      faltas: 0,
      horas_esperadas: 160,
      horas_trabajadas: 158,
      cumplimiento: 98.75,
      clasificacion: 'Excelente',
    },
    {
      anio: 2026,
      mes: 3,
      dias_esperados: 21,
      dias_trabajados: 18,
      tardias: 3,
      faltas: 0,
      horas_esperadas: 168,
      horas_trabajadas: 150,
      cumplimiento: 89.29,
      clasificacion: 'Bueno',
    },
    {
      anio: 2026,
      mes: 4,
      dias_esperados: 22,
      dias_trabajados: 8,
      tardias: 1,
      faltas: 2,
      horas_esperadas: 176,
      horas_trabajadas: 64,
      cumplimiento: 36.36,
      clasificacion: 'En riesgo',
    },
  ];

  for (const kpi of kpiData) {
    await pool.query(`
      INSERT INTO KPI_MENSUAL (empleado_id, anio, mes, dias_esperados, dias_trabajados, tardias, faltas, horas_esperadas, horas_trabajadas, cumplimiento_pct, clasificacion, fecha_calculo)
      VALUES (${empleadoId}, ${kpi.anio}, ${kpi.mes}, ${kpi.dias_esperados}, ${kpi.dias_trabajados}, ${kpi.tardias}, ${kpi.faltas}, ${kpi.horas_esperadas}, ${kpi.horas_trabajadas}, ${kpi.cumplimiento}, '${kpi.clasificacion}', GETDATE())
    `);
  }
  console.log('6. KPIs insertados (4 meses)');

  // 7. Insertar planilla para el empleado (boleta)
  const periodos = await pool.query(
    "SELECT TOP 1 periodo_id FROM PERIODO_PLANILLA WHERE estado = 'abierto'",
  );
  if (periodos.recordset.length > 0) {
    const periodoId = periodos.recordset[0].periodo_id;

    const planillaResult = await pool.query(`
      INSERT INTO PLANILLA_EMPLEADO (periodo_id, empleado_id, tarifa_hora_usada, horas_pagables, monto_bruto, total_bonificaciones, total_deducciones, monto_neto)
      OUTPUT INSERTED.planilla_emp_id
      VALUES (${periodoId}, ${empleadoId}, 30.00, 160, 4800, 500, 1200, 4100)
    `);
    const planillaEmpId = planillaResult.recordset[0].planilla_emp_id;
    console.log('7a. Planilla insertada, id:', planillaEmpId);

    // usuario_id_regista = 3 (admin)
    await pool.query(`
      INSERT INTO MOVIMIENTO_PLANILLA (planilla_emp_id, concepto_id, tipo, usuario_id_regista, monto, es_manual)
      VALUES 
        (${planillaEmpId}, 1, 'ingreso', 3, 4800, 0),
        (${planillaEmpId}, 2, 'ingreso', 3, 200, 0),
        (${planillaEmpId}, 3, 'ingreso', 3, 300, 0),
        (${planillaEmpId}, 6, 'deduccion', 3, 800, 0),
        (${planillaEmpId}, 7, 'deduccion', 3, 400, 0)
    `);
    console.log('7b. Movimientos insertados');
  }

  await pool.close();
  console.log('\n=== TODOS LOS DATOS INSERTADOS PARA EMPLEADO ID', empleadoId, '===');
})();
