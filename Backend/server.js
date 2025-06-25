// server.js - Servidor Backend para Ferremax
// Versión limpia y modularizada, lista para producción

// --- CONFIGURACIÓN Y DEPENDENCIAS ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

// --- MIDDLEWARES GLOBALES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- IMPORTAR ROUTERS ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const publicRoutes = require('./routes/public');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

// --- USAR ROUTERS ---
app.use('/api', productRoutes);
app.use('/api', publicRoutes);
app.use('/api', orderRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);

// --- RUTA PARA EL ASISTENTE IA ---
const { chat } = require('./controllers/aiController');
app.post('/api/ai-assistant/chat', chat);

// --- RUTA DE SALUD ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor Ferremax escuchando en puerto ${PORT}`);
});