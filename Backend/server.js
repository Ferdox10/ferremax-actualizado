// server.js - Servidor Backend Unificado para Ferremax con Wompi, Admin CRUD, Personalización y Asistente IA (Gemini)
// Versión que lee la configuración de la DB desde variables de entorno estándar (.env localmente)
// Añadido SSL para conexión a TiDB Cloud
// *** Integrado Asistente IA con Gemini de Google y logueo detallado para depuración RAG ***
// *** Mejorado prompt de IA para conciencia de página y conocimiento de políticas ***

// --- DEPENDENCIAS ---
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeApp } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Montar rutas modulares
app.use('/api/admin', require('./src/api/routes/admin.routes'));
app.use('/api', require('./src/api/routes/auth.routes'));
app.use('/api', require('./src/api/routes/public.routes'));
app.use('/api', require('./src/api/routes/content.routes'));
app.use('/api', require('./src/api/routes/payment.routes'));

// Inicialización y arranque del servidor
let server;
initializeApp().then(() => {
    server = app.listen(PORT, () => {
        console.log(`Servidor Ferremax escuchando en puerto ${PORT}`);
    });
}).catch(err => {
    console.error('Fallo crítico al inicializar la aplicación:', err);
    process.exit(1);
});

// Manejo de cierre graceful
const gracefulShutdown = (signal) => {
    console.log(`\n==> Recibida señal ${signal}. Cerrando servidor...`);
    server.close(async () => {
        try {
            const { dbPool } = require('./src/config/database');
            if (dbPool) await dbPool.end();
        } catch (err) {
            console.error('Error durante el cierre del pool de DB:', err);
        } finally {
            process.exit(0);
        }
    });
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));