// backend/middleware/authMiddleware.js
const { getPool } = require('../config/database');

const checkAdmin = (req, res, next) => {
    const isAdminSimulated = req.headers['x-admin-simulated'] === 'true';
    if (isAdminSimulated) {
        return next();
    }
    console.warn(`\t[Admin Check] Acceso DENEGADO a ruta admin ${req.method} ${req.path}.`);
    res.status(403).json({ success: false, message: 'Acceso prohibido. Se requieren permisos de administrador.' });
};

const checkUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId || isNaN(parseInt(userId))) {
        console.warn(`\t[User Check] Acceso DENEGADO: Falta o es inválido x-user-id.`);
        return res.status(401).json({ success: false, message: 'Autenticación requerida.' });
    }
    try {
        const dbPool = getPool();
        const [users] = await dbPool.query('SELECT id FROM usuarios WHERE id = ?', [userId]);
        if (users.length === 0) {
            console.warn(`\t[User Check] Usuario con ID ${userId} no encontrado.`);
            return res.status(401).json({ success: false, message: 'Usuario no válido.' });
        }
        req.userId = parseInt(userId);
        next();
    } catch (error) {
        console.error('!!! Error en middleware checkUser:', error);
        return res.status(500).json({ success: false, message: 'Error de autenticación.' });
    }
};

module.exports = { checkAdmin, checkUser };