const { getPool } = require('../../config/database');

// Controlador de pedidos para admin
module.exports = {
  // Métodos para gestión de pedidos desde el panel admin
  // Listar todos los pedidos
  getAllOrders: async (req, res) => {
    const dbPool = getPool();
    try {
      const [orders] = await dbPool.query(`SELECT ped.ID_Pedido, ped.Fecha_Pedido, ped.Total_Pedido, ped.Estado_Pedido, ped.Metodo_Pago, ped.Referencia_Pago, COALESCE(u.username, ped.Nombre_Cliente_Envio) as Cliente_Nombre, COALESCE(u.email, ped.Email_Cliente_Envio) as Cliente_Email FROM pedidos ped LEFT JOIN usuarios u ON ped.ID_Usuario = u.id ORDER BY ped.Fecha_Pedido DESC`);
      res.status(200).json(orders);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // Detalle de un pedido
  getOrderById: async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
    try {
      const [pedido] = await dbPool.query(`SELECT p.*, COALESCE(u.username, p.Nombre_Cliente_Envio) as Cliente_Nombre, COALESCE(u.email, p.Email_Cliente_Envio) as Cliente_Email FROM pedidos p LEFT JOIN usuarios u ON p.ID_Usuario=u.id WHERE p.ID_Pedido=?`, [id]);
      if (pedido.length === 0) return res.status(404).json({ message: 'Pedido no encontrado.' });
      const [detalles] = await dbPool.query(`SELECT dp.*, pr.Nombre as Nombre_Producto, pr.imagen_url as Imagen_Producto FROM detalles_pedido dp JOIN producto pr ON dp.ID_Producto=pr.ID_Producto WHERE dp.ID_Pedido=?`, [id]);
      res.status(200).json({ ...pedido[0], detalles });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // Cambiar estado de un pedido
  updateOrderStatus: async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    const { nuevoEstado } = req.body;
    const valid = ['Pendiente de Pago', 'Pagado', 'Procesando', 'Enviado', 'Entregado', 'Cancelado', 'Pendiente de Confirmacion'];
    if (!valid.includes(nuevoEstado)) return res.status(400).json({ message: 'Estado inválido.' });
    try {
      const [r] = await dbPool.query('UPDATE pedidos SET Estado_Pedido=? WHERE ID_Pedido=?', [nuevoEstado, id]);
      if (r.affectedRows === 0) return res.status(404).json({ message: 'Pedido no encontrado.' });
      res.status(200).json({ success: true, message: 'Estado actualizado.' });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },
};
