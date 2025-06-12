const mysql = require('mysql2/promise');

let dbPool;

async function initializeApp() {
    dbPool = mysql.createPool({
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
    const connection = await dbPool.getConnection();
    console.log(`--> Conexión exitosa a la base de datos '${connection.config.database}' en ${connection.config.host}:${connection.config.port}`);
    connection.release();
}

module.exports = { dbPool, initializeApp };
