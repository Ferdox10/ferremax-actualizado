// Helper para getOrCreateClienteId
const getOrCreateClienteId = async (connection, { username, email }) => {
    if (!email) {
        throw new Error("El email es requerido para crear o encontrar un cliente.");
    }
    // Buscar cliente existente por email
    const [clientes] = await connection.query('SELECT ID_Cliente FROM cliente WHERE Email = ? LIMIT 1', [email]);
    if (clientes.length > 0) {
        return clientes[0].ID_Cliente;
    }
    // Si no existe, crear uno nuevo
    const [result] = await connection.query(
        'INSERT INTO cliente (Nombre, Apellido, Email) VALUES (?, ?, ?)',
        [username || email.split('@')[0], '', email]
    );
    return result.insertId;
};

module.exports = { getOrCreateClienteId };
