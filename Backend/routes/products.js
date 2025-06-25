// Rutas públicas de productos, categorías, reseñas
const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, getProductReviews, addProductReview } = require('../controllers/productController');

router.get('/productos', getAllProducts);
router.get('/productos/:id', getProductById);
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', addProductReview);

module.exports = router;
