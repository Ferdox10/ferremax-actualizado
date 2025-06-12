// Rutas para Wompi y PayPal (vacío por ahora)

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/wompi/temp-order', paymentController.createWompiTempOrder);
router.post('/wompi/webhook', paymentController.wompiWebhook);
router.post('/orders/cash-on-delivery', paymentController.cashOnDelivery);
router.post('/paypal/create-order', paymentController.createPaypalOrder);
router.post('/paypal/capture-order', paymentController.capturePaypalOrder);

module.exports = router;
