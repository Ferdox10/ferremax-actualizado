// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { checkAdmin } = require('../middleware/authMiddleware');

// Importar todos los controladores de admin
const adminProductCtrl = require('../controllers/admin/productController');
const adminUserCtrl = require('../controllers/admin/userController');
const adminOrderCtrl = require('../controllers/admin/orderController');
const adminSettingsCtrl = require('../controllers/admin/settingsController');
const adminContentCtrl = require('../controllers/admin/contentController');
const adminAnalyticsCtrl = require('../controllers/admin/analyticsController');
const adminMessageCtrl = require('../controllers/admin/messageController');

// Aplicar middleware de administrador a todas las rutas de este archivo
router.use(checkAdmin);

// --- RUTAS CRUD PRODUCTOS ---
router.get('/products', adminProductCtrl.getAllProducts);
router.post('/products', adminProductCtrl.createProduct);
router.get('/products/:id', adminProductCtrl.getProductById);
router.put('/products/:id', adminProductCtrl.updateProduct);
router.delete('/products/:id', adminProductCtrl.deleteProduct);

// --- RUTAS CRUD USUARIOS ---
router.get('/users', adminUserCtrl.getAllUsers);
router.patch('/users/:id/role', adminUserCtrl.updateUserRole);
router.delete('/users/:id', adminUserCtrl.deleteUser);

// --- RUTAS ÓRDENES ---
router.get('/orders', adminOrderCtrl.getAllOrders);
router.get('/orders/:id', adminOrderCtrl.getOrderById);
router.put('/orders/:id/status', adminOrderCtrl.updateOrderStatus);

// --- RUTAS MENSAJES DE CONTACTO ---
router.get('/messages', adminMessageCtrl.getAllMessages);
router.post('/reply-message', adminMessageCtrl.replyToMessage);
router.patch('/messages/:id/status', adminMessageCtrl.updateMessageStatus);
router.patch('/messages/:id/star', adminMessageCtrl.toggleMessageStar);
router.delete('/messages/:id', adminMessageCtrl.deleteMessage);

// --- RUTAS CONFIGURACIÓN DEL SITIO ---
router.get('/settings', adminSettingsCtrl.getSettings);
router.put('/settings', adminSettingsCtrl.updateSettings);

// --- RUTAS CONTENIDO (Políticas, FAQ) ---
router.post('/content/policies', adminContentCtrl.createPolicy);
router.put('/content/policies', adminContentCtrl.updatePolicies);
router.delete('/content/policies/:id', adminContentCtrl.deletePolicy);
router.post('/content/faq', adminContentCtrl.createFaq);
router.put('/content/faq', adminContentCtrl.updateFaqs);
router.delete('/content/faq/:id', adminContentCtrl.deleteFaq);

// --- RUTAS ANALÍTICAS ---
router.get('/analytics/sales-overview', adminAnalyticsCtrl.getSalesOverview);
router.get('/analytics/product-views', adminAnalyticsCtrl.getProductViews);

module.exports = router;