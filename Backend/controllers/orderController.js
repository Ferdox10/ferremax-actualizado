const dbPool = require('../config/database');
const { getOrCreateClienteId } = require('../models/client');

// WOMPI almacenamiento temporal (debería migrarse a Redis o similar en producción)
const wompiTempOrders = {};
const WOMPI_TEMP_ORDER_TIMEOUT = 1000 * 60 * 30;

const getUserOrders = async (req, res) => {
    const userId = req.userId;
    try {
        const [pedidos] = await dbPool.query(
            `SELECT p.ID_Pedido, p.Fecha_Pedido, p.Total_Pedido, p.Estado_Pedido, p.Metodo_Pago, p.Referencia_Pago
             FROM pedidos p WHERE p.ID_Usuario = ? ORDER BY p.Fecha_Pedido DESC`,
            [userId]
        );
        if (pedidos.length === 0) {
            return res.status(200).json({ success: true, orders: [] });
        }
        const ordersWithDetails = await Promise.all(
            pedidos.map(async (pedido) => {
                const [detalles] = await dbPool.query(
                    `SELECT dp.ID_Producto, prod.Nombre as name, prod.imagen_url as imageUrl, dp.Cantidad as quantity, dp.Precio_Unitario_Compra as pricePaid
                     FROM detalles_pedido dp
                     JOIN producto prod ON dp.ID_Producto = prod.ID_Producto
                     WHERE dp.ID_Pedido = ?`,
                    [pedido.ID_Pedido]
                );
                return { ...pedido, items: detalles };
            })
        );
        res.status(200).json({ success: true, orders: ordersWithDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el historial de compras.' });
    }
};

// Aquí irían los métodos para temp-order, webhook, cash-on-delivery, etc.
// Por brevedad, solo se muestra el historial de usuario como ejemplo.

module.exports = { getUserOrders };
