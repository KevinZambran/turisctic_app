const { Pool } = require('pg');

// Configuración de conexión a la base de datos
const pool = new Pool({
    user: 'rvsuxgiu',
    host: 'stampy.db.elephantsql.com',
    database: 'rvsuxgiu',
    password: '2lobdShcYwLzXfIJQGS5kho4rjuTKBC3',
    port: 5432,
  });

module.exports = pool;