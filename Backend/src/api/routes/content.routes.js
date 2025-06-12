// Rutas para políticas y FAQ (vacío por ahora)

const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

router.get('/policies', contentController.getPolicies);
router.get('/faq', contentController.getFaq);

module.exports = router;
