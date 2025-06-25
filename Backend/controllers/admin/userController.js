const { getPool } = require('../../config/database');

// Listar todos los usuarios
const getAllUsers = async (req, res) => {
    const dbPool = getPool();
    try {
        const [users] = await dbPool.query('SELECT id, username, email, role FROM usuarios ORDER BY id DESC');
        res.status(200).json(users);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Cambiar el rol de un usuario
const updateUserRole = async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'cliente'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Rol no válido.' });
    }
    try {
        const [result] = await dbPool.query('UPDATE usuarios SET role = ? WHERE id = ?', [role, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ success: true, message: 'Rol de usuario actualizado.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el rol.' });
    }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    try {
        const [result] = await dbPool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ success: true, message: 'Usuario eliminado correctamente.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'No se puede eliminar: el usuario tiene pedidos asociados. Considere desactivarlo en su lugar.' });
        }
        res.status(500).json({ success: false, message: 'Error al eliminar el usuario.' });
    }
};

module.exports = { getAllUsers, updateUserRole, deleteUser };
