// Rutas para /api/admin/... (vacío por ahora)

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { checkAdmin } = require('../middleware/authMiddleware');

// Productos
router.get('/products', checkAdmin, adminController.getAdminProducts);
router.get('/products/:id', checkAdmin, adminController.getAdminProductById);
router.post('/products', checkAdmin, adminController.addAdminProduct);
router.put('/products/:id', checkAdmin, adminController.updateAdminProduct);
router.delete('/products/:id', checkAdmin, adminController.deleteAdminProduct);
// Usuarios
router.get('/users', checkAdmin, adminController.getAdminUsers);
// Settings
router.get('/settings', checkAdmin, adminController.getAdminSettings);
// Analytics
router.get('/analytics/sales-overview', checkAdmin, adminController.getSalesOverview);
router.get('/analytics/product-views', checkAdmin, adminController.getProductViews);
// Mensajes
router.get('/messages', checkAdmin, adminController.getAdminMessages);
router.patch('/messages/:id/status', checkAdmin, adminController.updateMessageStatus);
router.patch('/messages/:id/star', checkAdmin, adminController.starMessage);
router.delete('/messages/:id', checkAdmin, adminController.deleteMessage);
router.post('/reply-message', checkAdmin, adminController.replyMessage);
// Políticas y FAQ admin
router.post('/content/policies', checkAdmin, adminController.createPolicy);
router.delete('/content/policies/:id', checkAdmin, adminController.deletePolicy);
router.post('/content/faq', checkAdmin, adminController.createFaq);
router.delete('/content/faq/:id', checkAdmin, adminController.deleteFaq);
router.put('/content/policies', checkAdmin, adminController.updatePolicies);
router.put('/content/faq', checkAdmin, adminController.updateFaqs);

module.exports = router;
