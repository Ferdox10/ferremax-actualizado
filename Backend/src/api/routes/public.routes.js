// Rutas para productos, categorías, etc. (vacío por ahora)

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { getExchangeRate } = require('../../services/exchangeRateService');
const { getGeminiResponse } = require('../../services/aiAssistantService');
const { checkUser } = require('../middleware/authMiddleware');

router.get('/productos', publicController.getProductos);
router.get('/productos/:id', publicController.getProductoById);
router.get('/products/:id/reviews', publicController.getReviews);
router.post('/products/:id/reviews', publicController.postReview);
router.get('/categories', publicController.getCategories);
router.post('/products/:id/view', publicController.postProductView);
router.get('/products/featured', publicController.getFeaturedProducts);

router.get('/currency/rate', async (req, res) => {
    const result = await getExchangeRate();
    if (result.success) {
        res.status(200).json({ success: true, rate: result.rate });
    } else {
        res.status(500).json(result);
    }
});

router.post('/ai-assistant/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ success: false, message: 'Mensaje vacío.' });
    }
    try {
        const aiReply = await getGeminiResponse(userMessage);
        res.json({ success: true, reply: aiReply });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/config', publicController.getConfig);
router.post('/contact', publicController.postContact);
router.get('/user/orders', checkUser, publicController.getUserOrders);

module.exports = router;
