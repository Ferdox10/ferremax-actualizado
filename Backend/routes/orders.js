// backend/routes/orders.js
const express = require('express');
const router = express.Router();
const {
    createWompiTempOrder,
    handleWompiWebhook,
    createCashOnDeliveryOrder,
    createPaypalOrder,
    capturePaypalOrder,
    getUserOrders
} = require('../controllers/orderController');
const { checkUser } = require('../middleware/authMiddleware');

// --- RUTAS DE USUARIO ---
router.get('/user/orders', checkUser, getUserOrders);

// --- RUTAS WOMPI ---
router.post('/wompi/temp-order', createWompiTempOrder);
router.post('/wompi/webhook', handleWompiWebhook);

// --- RUTA CONTRA ENTREGA ---
router.post('/orders/cash-on-delivery', createCashOnDeliveryOrder);

// --- RUTAS PAYPAL ---
router.post('/paypal/create-order', createPaypalOrder);
router.post('/paypal/capture-order', capturePaypalOrder); // La autorización se maneja dentro del controlador

module.exports = router;