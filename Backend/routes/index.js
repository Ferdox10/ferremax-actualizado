// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Importar todos los enrutadores modulares
const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const { chatWithAI } = require('../controllers/aiController');
const { getPublicConfig } = require('../controllers/publicController');

// Rutas de Configuración Pública
router.get('/config', getPublicConfig);

// Enrutadores modulares
router.use('/auth', authRoutes);
router.use('/products', productRoutes); // Cambiado de 'productos' a 'products' para consistencia
router.use('/', publicRoutes); // Rutas públicas como /contact, /content/*
router.use('/', orderRoutes); // Rutas de pago como /wompi/*, /orders/*

// Ruta del Asistente IA
router.post('/ai-assistant/chat', chatWithAI);

// Rutas de Administración (protegidas por middleware dentro del propio archivo)
router.use('/admin', adminRoutes);

module.exports = router;