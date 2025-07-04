// backend/config/database.js
const mysql = require('mysql2/promise');

let dbPool;

async function initializeDB() {
    try {
        console.log("Intentando conectar a la DB...");
        dbPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: process.env.DB_SSL_CA
                ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true }
                : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : null)
        });

        const connection = await dbPool.getConnection();
        console.log(`--> Conexión exitosa a la base de datos '${connection.config.database}' en ${connection.config.host}:${connection.config.port}`);
        connection.release();
    } catch (error) {
        console.error("!!! Error CRÍTICO al conectar a la DB:", error);
        throw error;
    }
}

function getPool() {
    if (!dbPool) {
        throw new Error("El pool de la base de datos no ha sido inicializado.");
    }
    return dbPool;
}

// Exporta el pool como función (para compatibilidad) y como default para los controladores
module.exports = new Proxy({}, {
    get(target, prop) {
        if (prop === 'initializeDB') return initializeDB;
        if (prop === 'getPool') return getPool;
        // Permite usar dbPool.query directamente
        if (!dbPool) throw new Error('El pool de la base de datos no ha sido inicializado.');
        return dbPool[prop];
    }
});