const { Pool } = require('pg');

// Configuración de conexión a la base de datos
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'user',
    password: '567',
    port: 5432,
  });

module.exports = pool;