// Controlador para políticas y FAQ

const { dbPool } = require('../../config/database');

const getPolicies = async (req, res) => {
    try {
        const [policies] = await dbPool.query('SELECT * FROM politicas ORDER BY orden ASC, id ASC');
        res.status(200).json({ success: true, policies });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cargar políticas.' });
    }
};

const getFaq = async (req, res) => {
    try {
        const [faqs] = await dbPool.query('SELECT * FROM preguntas_frecuentes ORDER BY orden ASC, id ASC');
        res.status(200).json({ success: true, faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cargar preguntas.' });
    }
};

module.exports = { getPolicies, getFaq };
