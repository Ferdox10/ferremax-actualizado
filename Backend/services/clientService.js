// backend/services/clientService.js

/**
 * Busca un cliente por email. Si no existe, lo crea.
 * Requiere una conexión de transacción activa para asegurar la atomicidad.
 * @param {object} connection - Conexión de la transacción de la base de datos.
 * @param {object} clientData - Datos del cliente { username, email }.
 * @returns {number} - El ID del cliente.
 */
async function getOrCreateClienteId(connection, { username, email }) {
    if (!email) {
        throw new Error("El email es requerido para crear o encontrar un cliente.");
    }
    // Usar la conexión de la transacción para todas las consultas
    const [clientes] = await connection.query('SELECT ID_Cliente FROM cliente WHERE Email = ? LIMIT 1', [email]);
    if (clientes.length > 0) {
        console.log(`\t\tCliente encontrado con email ${email}, ID: ${clientes[0].ID_Cliente}`);
        return clientes[0].ID_Cliente;
    }

    console.log(`\t\tCreando nuevo cliente para email ${email}...`);
    const [result] = await connection.query(
        'INSERT INTO cliente (Nombre, Apellido, Email) VALUES (?, ?, ?)',
        [username || email.split('@')[0], '', email]
    );
    console.log(`\t\tNuevo cliente creado con ID: ${result.insertId}`);
    return result.insertId;
}

module.exports = { getOrCreateClienteId };