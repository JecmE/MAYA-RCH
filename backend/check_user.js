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
  const result = await pool.query(
    "SELECT u.usuario_id, u.username, r.nombre as rol FROM USUARIO_ROL ur JOIN USUARIO u ON ur.usuario_id = u.usuario_id JOIN ROL r ON ur.rol_id = r.rol_id WHERE u.username = 'empleado1'",
  );
  console.log(JSON.stringify(result.recordset));
  await pool.close();
})();
