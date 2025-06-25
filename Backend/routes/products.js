// backend/routes/products.js
const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getProductReviews,
    addProductReview
} = require('../controllers/productController');

// Rutas públicas de productos
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

// Rutas de reseñas
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', addProductReview); // checkUser podría ser opcional aquí si permites reseñas anónimas

module.exports = router;