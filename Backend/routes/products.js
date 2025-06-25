// backend/routes/products.js
const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    getProductReviews,
    addProductReview,
    trackProductView,
    getAllCategories
} = require('../controllers/productController');
const { checkUser } = require('../middleware/authMiddleware');

// Rutas públicas de productos
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getAllCategories);
router.get('/:id', getProductById);
router.post('/:id/view', trackProductView);

// Rutas de reseñas
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', addProductReview); // checkUser podría ser opcional aquí si permites reseñas anónimas

module.exports = router;