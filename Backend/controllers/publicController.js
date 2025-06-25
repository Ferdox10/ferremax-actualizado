const { getPool } = require('../config/database');
const axios = require('axios');

// Obtener categorías
const getCategories = async (req, res) => {
    const dbPool = getPool();
    try {
        const [results] = await dbPool.query('SELECT ID_Categoria, Nombre FROM categoria ORDER BY Nombre ASC');
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener las categorías.' });
    }
};

// Enviar mensaje de contacto
const handleContactForm = async (req, res) => {
    const dbPool = getPool();
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "Nombre, email y mensaje son requeridos." });
        }
        await dbPool.query(
            'INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, subject || null, message]
        );
        res.status(200).json({ success: true, message: '¡Mensaje recibido! Gracias por contactarnos.' });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno al procesar el mensaje." });
    }
};

// Registrar vista de producto
const trackProductView = async (req, res) => {
    const dbPool = getPool();
    const { id: productId } = req.params;
    if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'ID de producto inválido.' });
    }
    try {
        const [productExists] = await dbPool.query('SELECT ID_Producto FROM producto WHERE ID_Producto = ?', [productId]);
        if (productExists.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        await dbPool.query('INSERT INTO vistas_producto (ID_Producto, Fecha_Vista) VALUES (?, NOW())', [productId]);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno al registrar la vista.' });
    }
};

// Políticas públicas
const getPublicPolicies = async (req, res) => {
    const dbPool = getPool();
    try {
        const [policies] = await dbPool.query('SELECT * FROM politicas ORDER BY orden ASC, id ASC');
        res.status(200).json({ success: true, policies });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cargar políticas.' });
    }
};

// FAQ públicas
const getPublicFaqs = async (req, res) => {
    const dbPool = getPool();
    try {
        const [faqs] = await dbPool.query('SELECT * FROM preguntas_frecuentes ORDER BY orden ASC, id ASC');
        res.status(200).json({ success: true, faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cargar preguntas.' });
    }
};

// Tasa de cambio
const getCurrencyRate = async (req, res) => {
    const dbPool = getPool();
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, message: 'Servicio de conversión no configurado en el servidor.', fallbackRate: 4000 });
    }
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    try {
        const response = await axios.get(apiUrl);
        if (response.data && response.data.result === 'success') {
            const rateCOP = response.data.conversion_rates.COP;
            if (!rateCOP) throw new Error("La moneda COP no fue encontrada en la respuesta de la API externa.");
            res.status(200).json({ success: true, rate: rateCOP });
        } else {
            throw new Error(`La API de tasa de cambio respondió con un error: ${response.data['error-type']}`);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'No se pudo obtener la tasa en tiempo real.', fallbackRate: 4000 });
    }
};

module.exports = { getCategories, handleContactForm, trackProductView, getPublicPolicies, getPublicFaqs, getCurrencyRate };
