// Rutas de contacto, contenido, etc.
const express = require('express');
const router = express.Router();
const { getCategories, sendContactMessage, registerProductView } = require('../controllers/publicController');

router.get('/categories', getCategories);
router.post('/contact', sendContactMessage);
router.post('/products/:id/view', registerProductView);

module.exports = router;
