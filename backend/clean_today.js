const sql = require('mssql');

const config = {
  server: 'Jec',
  database: 'MAYA_CRH_DB',
  user: 'maya_user',
  password: 'mayacrh',
  options: { trustServerCertificate: true, encrypt: false },
};

async function cleanToday() {
  try {
    await sql.connect(config);

    // Delete today's attendance for employee 9
    await sql.query(
      `DELETE FROM REGISTRO_ASISTENCIA WHERE empleado_id = 9 AND fecha = CAST(GETDATE() AS DATE)`,
    );
    console.log('Deleted today record');

    // Show remaining records
    const result = await sql.query(
      `SELECT asistencia_id, fecha, hora_entrada_real, hora_salida_real FROM REGISTRO_ASISTENCIA WHERE empleado_id = 9 ORDER BY fecha DESC`,
    );
    console.log('Remaining records:', result.recordset);

    await sql.close();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

cleanToday();
