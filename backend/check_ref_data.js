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

  const t1 = await pool.query('SELECT TOP 3 * FROM TURNO');
  console.log('TURNOS:', JSON.stringify(t1.recordset));

  const t2 = await pool.query('SELECT * FROM TIPO_PERMISO');
  console.log('TIPOS_PERMISO:', JSON.stringify(t2.recordset));

  const t3 = await pool.query('SELECT TOP 3 * FROM PROYECTO');
  console.log('PROYECTOS:', JSON.stringify(t3.recordset));

  const t4 = await pool.query('SELECT * FROM PERIODO_PLANILLA');
  console.log('PERIODOS:', JSON.stringify(t4.recordset));

  const t5 = await pool.query('SELECT * FROM CONCEPTO_PLANILLA');
  console.log('CONCEPTOS:', JSON.stringify(t5.recordset));

  await pool.close();
})();
