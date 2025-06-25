const dbPool = require('../../config/database');

const getAllProducts = async (req, res) => {
    try {
        const [r] = await dbPool.query('SELECT * FROM producto ORDER BY ID_Producto ASC');
        res.status(200).json(r);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
        const [r] = await dbPool.query('SELECT * FROM producto WHERE ID_Producto = ?', [id]);
        if (r.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.status(200).json(r[0]);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = { getAllProducts, getProductById };
