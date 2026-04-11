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
  const r = await pool.query('SELECT DISTINCT estado FROM SOLICITUD_PERMISO');
  console.log('Estados existentes:', JSON.stringify(r.recordset));
  await pool.close();
})();
