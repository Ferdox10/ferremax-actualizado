// backend/routes/public.js
const express = require('express');
const router = express.Router();
const {
    handleContactForm,
    getCurrencyRate,
    getPublicPolicies,
    getPublicFaqs,
    getCategories,
    trackProductView
} = require('../controllers/publicController');

// Ruta para el formulario de contacto
router.post('/contact', handleContactForm);

// Ruta para la tasa de cambio
router.get('/currency/rate', getCurrencyRate);

// Rutas para contenido público (políticas, FAQ)
router.get('/content/policies', getPublicPolicies);
router.get('/content/faq', getPublicFaqs);

// Ruta para obtener categorías
router.get('/categories', getCategories);

// Ruta para registrar vista de producto
router.post('/products/:id/view', trackProductView);

module.exports = router;