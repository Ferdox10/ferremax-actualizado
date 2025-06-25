// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDB } = require('./config/database');
const { loadSiteSettings } = require('./services/siteSettings');
const { initializeAI } = require('./config/ai');
const mainRouter = require('./routes'); // Importa el enrutador principal

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// --- MIDDLEWARE GENERAL ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- RUTAS PRINCIPALES DE LA API ---
// Todas las rutas estarán bajo el prefijo /api
app.use('/api', mainRouter);

// --- INICIO DEL SERVIDOR ---
async function startServer() {
    try {
        await initializeDB();
        await loadSiteSettings();
        initializeAI(); // Inicializa el SDK de Gemini

        const server = app.listen(PORT, () => {
            console.log("\n========================================");
            console.log(`==> Servidor Ferremax escuchando en puerto ${PORT}`);
            console.log(`==> Modo: ${isProduction ? 'Producción' : 'Desarrollo'}`);
            console.log("========================================");
        });

        // Manejo de cierre graceful
        const gracefulShutdown = (signal) => {
            console.log(`\n==> Recibida señal ${signal}. Cerrando servidor...`);
            server.close(async () => {
                console.log('--> Servidor HTTP cerrado.');
                const { getPool } = require('./config/database');
                const dbPool = getPool();
                if (dbPool) await dbPool.end();
                console.log('--> Pool de DB cerrado.');
                process.exit(0);
            });
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    } catch (error) {
        console.error("Fallo CRÍTICO al inicializar la aplicación. El servidor no arrancará.", error);
        process.exit(1);
    }
}

startServer();