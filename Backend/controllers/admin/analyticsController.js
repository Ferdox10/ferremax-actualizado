const { getPool } = require('../../config/database');

// Analítica de ventas y KPIs
const getSalesOverview = async (req, res) => {
    const dbPool = getPool();
    try {
        const [salesData] = await dbPool.query(`SELECT COALESCE(SUM(CASE WHEN Fecha_Pedido >= CURDATE() - INTERVAL 30 DAY THEN Total_Pedido ELSE 0 END), 0) as totalSales30Days, (SELECT COUNT(*) FROM pedidos) as totalOrders, (SELECT COUNT(*) FROM usuarios) as totalUsers FROM pedidos WHERE Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado')`);
        const [dailySales] = await dbPool.query(`SELECT DATE_FORMAT(Fecha_Pedido, '%Y-%m-%d') as dia, SUM(Total_Pedido) as total_ventas FROM pedidos WHERE Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado') AND Fecha_Pedido >= CURDATE() - INTERVAL 30 DAY GROUP BY dia ORDER BY dia ASC`);
        const [topProducts] = await dbPool.query(`SELECT p.Nombre, SUM(dp.Cantidad) as total_vendido FROM detalles_pedido dp JOIN producto p ON dp.ID_Producto = p.ID_Producto JOIN pedidos ped ON dp.ID_Pedido = ped.ID_Pedido WHERE ped.Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado') GROUP BY p.ID_Producto, p.Nombre ORDER BY total_vendido DESC LIMIT 5`);
        res.status(200).json({ kpis: salesData[0], dailySales, topProducts });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Analítica de vistas de productos
const getProductViews = async (req, res) => {
    const dbPool = getPool();
    try {
        const [productViews] = await dbPool.query(`SELECT p.Nombre, COUNT(vp.ID_Vista) as total_vistas FROM vistas_producto vp JOIN producto p ON vp.ID_Producto = p.ID_Producto GROUP BY p.ID_Producto, p.Nombre ORDER BY total_vistas DESC LIMIT 10`);
        res.status(200).json({ success: true, views: productViews });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Controlador de analíticas para admin
module.exports = { getSalesOverview, getProductViews };
