// Rutas de administración
const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById } = require('../controllers/admin/productController');

router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);

module.exports = router;
