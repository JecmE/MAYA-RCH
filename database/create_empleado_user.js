const sql = require('mssql');
const bcrypt = require('bcrypt');

(async () => {
  const pool = new sql.ConnectionPool({
    server: 'Jec',
    database: 'MAYA_CRH_DB',
    user: 'maya_user',
    password: 'mayacrh',
    options: { encrypt: false },
  });

  await pool.connect();

  const hash = await bcrypt.hash('empleado123', 10);

  const empResult = await pool.query(`
    INSERT INTO EMPLEADO (codigoEmpleado, nombres, apellidos, email, fechaIngreso, activo)
    OUTPUT INSERTED.empleado_id
    VALUES ('EMP001', 'Juan', 'Perez', 'juan.perez@test.com', GETDATE(), 1)
  `);
  const empId = empResult.recordset[0].empleado_id;
  console.log('Empleado creado:', empId);

  const userResult = await pool.query(`
    INSERT INTO USUARIO (empleado_id, username, password_hash, estado)
    OUTPUT INSERTED.usuario_id
    VALUES (${empId}, 'empleado1', '${hash}', 'activo')
  `);
  const userId = userResult.recordset[0].usuario_id;
  console.log('Usuario creado:', userId);

  await pool.query(`
    INSERT INTO USUARIO_ROL (usuario_id, rol_id)
    VALUES (${userId}, 1)
  `);
  console.log('Rol Empleado asignado');

  await pool.close();
  console.log('Listo! Usuario empleado1 / empleado123 creado');
})();
