// Este archivo ahora solo exporta el pool de la base de datos
const mysql = require('mysql2/promise');
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : null)
});
module.exports = dbPool;
