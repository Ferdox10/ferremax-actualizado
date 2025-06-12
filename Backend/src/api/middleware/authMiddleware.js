const { dbPool } = require('../../config/database');

const checkAdmin = (req, res, next) => {
    const isAdminSimulated = req.headers['x-admin-simulated'] === 'true';
    if (isAdminSimulated) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Acceso prohibido. Se requieren permisos de administrador.' });
    }
};

const checkUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(401).json({ success: false, message: 'Autenticación requerida.' });
    }
    try {
        const [users] = await dbPool.query('SELECT id FROM usuarios WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuario no válido.' });
        }
        req.userId = parseInt(userId);
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error de autenticación.' });
    }
};

module.exports = { checkAdmin, checkUser };
