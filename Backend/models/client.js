// Helper para getOrCreateClienteId
const getOrCreateClienteId = async (connection, { username, email }) => {
    if (!email) {
        throw new Error("El email es requerido para crear o encontrar un cliente.");
    }
    const [clientes] = await connection.query('SELECT ID_Cliente FROM cliente WHERE Email = ? LIMIT 1', [email]);
    if (clientes.length > 0) {
        return clientes[0].ID_Cliente;
    }
    const [result] = await connection.query(
        'INSERT INTO cliente (Nombre, Apellido, Email) VALUES (?, ?, ?)',
