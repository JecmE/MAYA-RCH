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

  // Limpiar planilla anterior
  await pool.query(
    `DELETE FROM MOVIMIENTO_PLANILLA WHERE planilla_emp_id IN (SELECT planilla_emp_id FROM PLANILLA_EMPLEADO WHERE empleado_id = ${empleadoId})`,
  );
  await pool.query(`DELETE FROM PLANILLA_EMPLEADO WHERE empleado_id = ${empleadoId}`);
  console.log('Planilla anterior limpiada');

  // Insertar planilla
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
    console.log('Planilla insertada, id:', planillaEmpId);

    await pool.query(`
      INSERT INTO MOVIMIENTO_PLANILLA (planilla_emp_id, concepto_id, tipo, usuario_id_regista, monto, es_manual)
      VALUES 
        (${planillaEmpId}, 1, 'ingreso', 3, 4800, 0),
        (${planillaEmpId}, 2, 'ingreso', 3, 200, 0),
        (${planillaEmpId}, 3, 'ingreso', 3, 300, 0),
        (${planillaEmpId}, 6, 'deduccion', 3, 800, 0),
        (${planillaEmpId}, 7, 'deduccion', 3, 400, 0)
    `);
    console.log('Movimientos insertados');
  }

  await pool.close();
  console.log('\n=== DATOS DE PLANILLA COMPLETADOS ===');
})();
