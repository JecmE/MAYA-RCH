const sql = require('mssql');

const config = {
  server: 'Jec',
  database: 'MAYA_CRH_DB',
  user: 'maya_user',
  password: 'mayacrh',
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
};

async function fixData() {
  try {
    await sql.connect(config);

    // Fix attendance records for employee 9 - set proper times
    const fixAttendance = `
      UPDATE REGISTRO_ASISTENCIA 
      SET hora_entrada_real = CASE 
          WHEN fecha = '2026-04-10' THEN '2026-04-10 08:00:00'
          WHEN fecha = '2026-04-09' THEN '2026-04-09 08:00:00'
          WHEN fecha = '2026-04-07' THEN '2026-04-07 08:00:00'
          WHEN fecha = '2026-04-06' THEN '2026-04-06 08:00:00'
          WHEN fecha = '2026-04-04' THEN '2026-04-04 08:00:00'
          WHEN fecha = '2026-04-03' THEN '2026-04-03 08:00:00'
          WHEN fecha = '2026-04-02' THEN '2026-04-02 08:00:00'
          WHEN fecha = '2026-04-01' THEN '2026-04-01 08:00:00'
        END,
        hora_salida_real = CASE
          WHEN fecha = '2026-04-09' THEN '2026-04-09 17:00:00'
          WHEN fecha = '2026-04-07' THEN '2026-04-07 17:00:00'
          WHEN fecha = '2026-04-06' THEN '2026-04-06 17:00:00'
          WHEN fecha = '2026-04-04' THEN '2026-04-04 17:00:00'
          WHEN fecha = '2026-04-03' THEN '2026-04-03 17:00:00'
          WHEN fecha = '2026-04-02' THEN '2026-04-02 17:00:00'
          WHEN fecha = '2026-04-01' THEN '2026-04-01 17:00:00'
        END
      WHERE empleado_id = 9;
    `;

    await sql.query(fixAttendance);
    console.log('Fixed attendance data');

    // Delete today's record so user can test fresh
    const deleteToday = `
      DELETE FROM REGISTRO_ASISTENCIA 
      WHERE empleado_id = 9 AND fecha = CAST(GETDATE() AS DATE);
    `;
    await sql.query(deleteToday);
    console.log('Deleted today record for fresh test');

    // Verify
    const result = await sql.query(
      `SELECT asistencia_id, fecha, hora_entrada_real, hora_salida_real FROM REGISTRO_ASISTENCIA WHERE empleado_id = 9 ORDER BY fecha DESC`,
    );
    console.log('Current data:', result.recordset);

    await sql.close();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

fixData();
