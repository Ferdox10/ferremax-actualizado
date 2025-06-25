const dbPool = require('../config/database');
const { getPool } = require('../config/database');

const getAllProducts = async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    try {
        let sql = 'SELECT * FROM producto';
        sql = `
            SELECT 
                p.*, 
                COALESCE(r.avg_rating, 0) as average_rating, 
                COALESCE(r.review_count, 0) as review_count
            FROM 
                producto p
            LEFT JOIN 
                (SELECT 
                    ID_Producto, 
                    AVG(Calificacion) as avg_rating, 
                    COUNT(*) as review_count 
                FROM reseñas 
                GROUP BY ID_Producto) r 
            ON 
                p.ID_Producto = r.ID_Producto
        `;
        if (limit && Number.isInteger(limit) && limit > 0) {
            sql += ` LIMIT ${limit}`;
        }
        const [results] = await dbPool.query(sql);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener los productos.' });
    }
};

const getProductById = async (req, res) => {
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

const getProductReviews = async (req, res) => {
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

const addProductReview = async (req, res) => {
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

const getFeaturedProducts = async (req, res) => {
    const dbPool = getPool();
    console.log("--> GET /api/products/featured (más vistos)");
    try {
        const sql = `
            SELECT 
                p.*,
                (SELECT AVG(Calificacion) FROM reseñas WHERE ID_Producto = p.ID_Producto) as average_rating,
                (SELECT COUNT(*) FROM reseñas WHERE ID_Producto = p.ID_Producto) as review_count
            FROM 
                producto p
            JOIN 
                (SELECT ID_Producto, COUNT(*) as view_count 
                 FROM vistas_producto 
                 GROUP BY ID_Producto) as v 
            ON p.ID_Producto = v.ID_Producto
            ORDER BY 
                v.view_count DESC
            LIMIT 4;
        `;
        const [results] = await dbPool.query(sql);

        // Si no hay productos con vistas, devolvemos los 4 primeros productos como fallback
        if (results.length === 0) {
            console.log("\tNo se encontraron productos con vistas, devolviendo productos de fallback.");
            const [fallbackResults] = await dbPool.query(`
                SELECT 
                    p.*,
                    COALESCE((SELECT AVG(Calificacion) FROM reseñas r WHERE r.ID_Producto = p.ID_Producto), 0) as average_rating,
                    COALESCE((SELECT COUNT(*) FROM reseñas r WHERE r.ID_Producto = p.ID_Producto), 0) as review_count
                FROM producto p LIMIT 4`
            );
            return res.status(200).json(fallbackResults);
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error GET /api/products/featured:', error);
        res.status(500).json({ success: false, message: 'Error al obtener productos destacados.' });
    }
};

module.exports = { getAllProducts, getProductById, getProductReviews, addProductReview, getFeaturedProducts };
