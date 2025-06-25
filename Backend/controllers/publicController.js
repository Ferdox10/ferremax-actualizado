const dbPool = require('../config/database');

const getCategories = async (req, res) => {
    try {
        const [results] = await dbPool.query('SELECT ID_Categoria, Nombre FROM categoria ORDER BY Nombre ASC');
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener las categorías.' });
    }
};

const sendContactMessage = async (req, res) => {
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

const registerProductView = async (req, res) => {
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

module.exports = { getCategories, sendContactMessage, registerProductView };
