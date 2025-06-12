const { dbPool } = require('../../config/database');

// --- Configuración del sitio (siteSettings) ---
let siteSettings = {};

async function loadSiteSettingsFromDB() {
    try {
        if (!dbPool) throw new Error('dbPool no inicializado');
        const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM site_settings');
        rows.forEach(row => {
            siteSettings[row.setting_key] = row.setting_value;
        });
        // Defaults
        const defaultSettings = {
            colorPrimary: '#ea580c', colorSecondary: '#047857', colorAccent: '#f1f5f9',
            welcomeTitle: 'Bienvenido a Ferremax', promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
            promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!',
            contactAddress: 'Calle Falsa 123, Barranquilla, Colombia', contactPhone: '+57 300 123 4567',
            contactEmail: 'info@ferremax.example.com', socialFacebook: '', socialTwitter: '',
            socialInstagram: '', socialYoutube: ''
        };
        for (const key in defaultSettings) {
            if (siteSettings[key] === undefined) {
                siteSettings[key] = defaultSettings[key];
                await dbPool.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, defaultSettings[key], defaultSettings[key]]);
            }
        }
    } catch (error) {
        siteSettings = {
            colorPrimary: '#ea580c', colorSecondary: '#047857', colorAccent: '#f1f5f9',
            welcomeTitle: 'Bienvenido a Ferremax', promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
            promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!',
            contactAddress: 'Calle Falsa 123, Barranquilla, Colombia', contactPhone: '+57 300 123 4567',
            contactEmail: 'info@ferremax.example.com', socialFacebook: '', socialTwitter: '',
            socialInstagram: '', socialYoutube: ''
        };
    }
}

// --- Helper para cliente ---
async function getOrCreateClienteId(connection, { username, email }) {
    if (!email) throw new Error('El email es requerido para crear o encontrar un cliente.');
    const [clientes] = await connection.query('SELECT ID_Cliente FROM cliente WHERE Email = ? LIMIT 1', [email]);
    if (clientes.length > 0) return clientes[0].ID_Cliente;
    const [result] = await connection.query('INSERT INTO cliente (Nombre, Apellido, Email) VALUES (?, ?, ?)', [username || email.split('@')[0], '', email]);
    return result.insertId;
}

// --- /api/config ---
const getConfig = (req, res) => {
    res.status(200).json({
        success: true,
        wompiPublicKey: process.env.WOMPI_PUBLIC_KEY,
        webhookUrl: `${process.env.BACKEND_URL}/api/wompi/webhook`
    });
};

// --- /api/contact ---
const postContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Nombre, email y mensaje son requeridos.' });
        }
        await dbPool.query('INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, NOW())', [name, email, subject || null, message]);
        res.status(200).json({ success: true, message: '¡Mensaje recibido! Gracias por contactarnos.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno al procesar el mensaje.' });
    }
};

// --- /api/user/orders ---
const getUserOrders = async (req, res) => {
    const userId = req.userId;
    try {
        const [pedidos] = await dbPool.query(`SELECT p.ID_Pedido, p.Fecha_Pedido, p.Total_Pedido, p.Estado_Pedido, p.Metodo_Pago, p.Referencia_Pago FROM pedidos p WHERE p.ID_Usuario = ? ORDER BY p.Fecha_Pedido DESC`, [userId]);
        if (pedidos.length === 0) return res.status(200).json({ success: true, orders: [] });
        const ordersWithDetails = await Promise.all(
            pedidos.map(async (pedido) => {
                const [detalles] = await dbPool.query(`SELECT dp.ID_Producto, prod.Nombre as name, prod.imagen_url as imageUrl, dp.Cantidad as quantity, dp.Precio_Unitario_Compra as pricePaid FROM detalles_pedido dp JOIN producto prod ON dp.ID_Producto = prod.ID_Producto WHERE dp.ID_Pedido = ?`, [pedido.ID_Pedido]);
                return { ...pedido, items: detalles };
            })
        );
        res.status(200).json({ success: true, orders: ordersWithDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el historial de compras.' });
    }
};

const getProductos = async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    try {
        let sql = `SELECT p.*, COALESCE(r.avg_rating, 0) as average_rating, COALESCE(r.review_count, 0) as review_count FROM producto p LEFT JOIN (SELECT ID_Producto, AVG(Calificacion) as avg_rating, COUNT(*) as review_count FROM reseñas GROUP BY ID_Producto) r ON p.ID_Producto = r.ID_Producto`;
        if (limit && Number.isInteger(limit) && limit > 0) {
            sql += ` LIMIT ${limit}`;
        }
        const [results] = await dbPool.query(sql);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener los productos.' });
    }
};

const getProductoById = async (req, res) => {
    const { id } = req.params;
    if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'El ID del producto debe ser un número.' });
    }
    try {
        const [results] = await dbPool.query(
            'SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 FROM producto WHERE ID_Producto = ?',
            [id]
        );
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        res.status(200).json(results[0]);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el detalle del producto.' });
    }
};

const getReviews = async (req, res) => {
    const { id: productId } = req.params;
    try {
        const [reviews] = await dbPool.query(
            'SELECT * FROM reseñas WHERE ID_Producto = ? ORDER BY Fecha_Reseña DESC',
            [productId]
        );
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cargar las reseñas.' });
    }
};

const postReview = async (req, res) => {
    const { id: productId } = req.params;
    const { userId, name, rating, comment } = req.body;
    if (!name || !rating || !comment) {
        return res.status(400).json({ success: false, message: 'Nombre, calificación y comentario son requeridos.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'La calificación debe ser entre 1 y 5.' });
    }
    try {
        await dbPool.query(
            'INSERT INTO reseñas (ID_Producto, ID_Usuario, Nombre_Usuario, Calificacion, Comentario, Fecha_Reseña) VALUES (?, ?, ?, ?, ?, NOW())',
            [productId, userId || null, name, rating, comment]
        );
        res.status(201).json({ success: true, message: '¡Gracias por tu reseña!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'No se pudo guardar tu reseña en este momento.' });
    }
};

const getCategories = async (req, res) => {
    try {
        const [results] = await dbPool.query('SELECT ID_Categoria, Nombre FROM categoria ORDER BY Nombre ASC');
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener las categorías.' });
    }
};

const postProductView = async (req, res) => {
    const { id: productId } = req.params;
    if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'ID de producto inválido.' });
    }
    try {
        const [productExists] = await dbPool.query('SELECT ID_Producto FROM producto WHERE ID_Producto = ?', [productId]);
        if (productExists.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        await dbPool.query('INSERT INTO vistas_producto (ID_Producto, Fecha_Vista) VALUES (?, NOW())', [productId]);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno al registrar la vista.' });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        const sql = `SELECT p.*, COALESCE(r.avg_rating, 0) as average_rating, COALESCE(r.review_count, 0) as review_count FROM vistas_producto vp JOIN producto p ON vp.ID_Producto = p.ID_Producto LEFT JOIN (SELECT ID_Producto, AVG(Calificacion) as avg_rating, COUNT(*) as review_count FROM reseñas GROUP BY ID_Producto) r ON p.ID_Producto = r.ID_Producto GROUP BY p.ID_Producto ORDER BY COUNT(vp.ID_Vista) DESC LIMIT 4;`;
        const [results] = await dbPool.query(sql);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener productos destacados.' });
    }
};

module.exports = {
  getProductos,
  getProductoById,
  getReviews,
  postReview,
  getCategories,
  postProductView,
  getFeaturedProducts,
  getConfig,
  postContact,
  getUserOrders,
  loadSiteSettingsFromDB,
  getOrCreateClienteId,
  siteSettings
};
