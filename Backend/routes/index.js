// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Importar todos los enrutadores modulares
const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const publicRoutes = require('./public');
const adminRoutes = require('./admin');
const { chat } = require('../controllers/aiController');
const { getPublicConfig } = require('../controllers/publicController');
const { getAllProducts, getProductById } = require('../controllers/productController');

// Rutas de Configuración Pública
router.get('/config', getPublicConfig);

// Enrutadores modulares
router.use('/auth', authRoutes);
router.use('/products', productRoutes); // Cambiado de 'productos' a 'products' para consistencia
router.use('/', publicRoutes); // Rutas públicas como /contact, /content/*
router.use('/', orderRoutes); // Rutas de pago como /wompi/*, /orders/*

// Ruta del Asistente IA
router.post('/ai-assistant/chat', chat);

// Rutas de Administración (protegidas por middleware dentro del propio archivo)
router.use('/admin', adminRoutes);

// Alias para compatibilidad con frontend antiguo (rutas en español)
router.get('/productos', getAllProducts);
router.get('/productos/:id', getProductById);

module.exports = router;