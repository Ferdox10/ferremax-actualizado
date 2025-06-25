// backend/controllers/admin/productController.js
const { getPool } = require('../../config/database');

// Listar todos los productos
const getAllProducts = async (req, res) => {
    const dbPool = getPool();
    try {
        const [products] = await dbPool.query('SELECT * FROM producto ORDER BY ID_Producto ASC');
        res.status(200).json(products);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
    try {
        const [product] = await dbPool.query('SELECT * FROM producto WHERE ID_Producto = ?', [id]);
        if (product.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.status(200).json(product[0]);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Crear producto
const createProduct = async (req, res) => {
    const dbPool = getPool();
    const p = req.body;
    if (!p.Nombre || p.precio_unitario === undefined || p.cantidad === undefined || !p.Marca) {
        return res.status(400).json({ message: 'Faltan datos.' });
    }
    const pr = parseFloat(p.precio_unitario), cn = parseInt(p.cantidad, 10), ci = p.ID_Categoria ? parseInt(p.ID_Categoria, 10) : null;
    if (isNaN(pr) || pr < 0 || isNaN(cn) || cn < 0 || (p.ID_Categoria && isNaN(ci))) return res.status(400).json({ message: 'Datos numéricos inválidos.' });
    try {
        const sql = `INSERT INTO producto (Nombre,Descripcion,precio_unitario,Marca,Codigo_Barras,ID_Categoria,cantidad,imagen_url,imagen_url_2,imagen_url_3,imagen_url_4,imagen_url_5) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
        const v = [p.Nombre, p.Descripcion || null, pr, p.Marca, p.Codigo_Barras || null, ci, cn, p.imagen_url || null, p.imagen_url_2 || null, p.imagen_url_3 || null, p.imagen_url_4 || null, p.imagen_url_5 || null];
        const [re] = await dbPool.query(sql, v);
        res.status(201).json({ success: true, message: 'Producto añadido.', productId: re.insertId });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Cód. Barras duplicado.' });
        res.status(500).json({ success: false, message: e.message });
    }
};

// Actualizar producto
const updateProduct = async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    const p = req.body;
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
    if (!p.Nombre || p.precio_unitario === undefined || p.cantidad === undefined || !p.Marca) return res.status(400).json({ message: 'Faltan datos.' });
    const pr = parseFloat(p.precio_unitario), cn = parseInt(p.cantidad, 10), ci = p.ID_Categoria ? parseInt(p.ID_Categoria, 10) : null;
    if (isNaN(pr) || pr < 0 || isNaN(cn) || cn < 0 || (p.ID_Categoria && isNaN(ci))) return res.status(400).json({ message: 'Datos numéricos inválidos.' });
    try {
        const sql = `UPDATE producto SET Nombre=?,Descripcion=?,precio_unitario=?,Marca=?,Codigo_Barras=?,ID_Categoria=?,cantidad=?,imagen_url=?,imagen_url_2=?,imagen_url_3=?,imagen_url_4=?,imagen_url_5=? WHERE ID_Producto=?`;
        const v = [p.Nombre, p.Descripcion || null, pr, p.Marca, p.Codigo_Barras || null, ci, cn, p.imagen_url || null, p.imagen_url_2 || null, p.imagen_url_3 || null, p.imagen_url_4 || null, p.imagen_url_5 || null, id];
        const [re] = await dbPool.query(sql, v);
        if (re.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.status(200).json({ success: true, message: 'Producto actualizado.' });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Cód. Barras duplicado.' });
        res.status(500).json({ success: false, message: e.message });
    }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
    try {
        const [re] = await dbPool.query('DELETE FROM producto WHERE ID_Producto=?', [id]);
        if (re.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.status(200).json({ success: true, message: 'Producto eliminado.' });
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Producto referenciado, no se puede eliminar.' });
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };