// Controlador para rutas de admin (vacío por ahora)

const { dbPool } = require('../../config/database');

const getAdminProducts = async (req, res) => {
    try { const [r] = await dbPool.query('SELECT * FROM producto ORDER BY ID_Producto ASC'); res.status(200).json(r); } 
    catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const getAdminProductById = async (req, res) => {
    try { const { id } = req.params; if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
        const [r] = await dbPool.query('SELECT * FROM producto WHERE ID_Producto = ?', [id]);
        if (r.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' }); res.status(200).json(r[0]);
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const addAdminProduct = async (req, res) => {
    try { const p = req.body; if (!p.Nombre||p.precio_unitario===undefined||p.cantidad===undefined||!p.Marca) return res.status(400).json({message:'Faltan datos.'});
        const pr=parseFloat(p.precio_unitario), cn=parseInt(p.cantidad,10), ci=p.ID_Categoria?parseInt(p.ID_Categoria,10):null;
        if(isNaN(pr)||pr<0||isNaN(cn)||cn<0||(p.ID_Categoria&&isNaN(ci))) return res.status(400).json({message:'Datos numéricos inválidos.'});
        const sql = `INSERT INTO producto (Nombre,Descripcion,precio_unitario,Marca,Codigo_Barras,ID_Categoria,cantidad,imagen_url,imagen_url_2,imagen_url_3,imagen_url_4,imagen_url_5) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
        const v = [p.Nombre,p.Descripcion||null,pr,p.Marca,p.Codigo_Barras||null,ci,cn,p.imagen_url||null,p.imagen_url_2||null,p.imagen_url_3||null,p.imagen_url_4||null,p.imagen_url_5||null];
        const [re] = await dbPool.query(sql,v); res.status(201).json({success:true,message:'Producto añadido.', productId:re.insertId});
    } catch (e) { if(e.code==='ER_DUP_ENTRY') return res.status(409).json({message:'Cód. Barras duplicado.'}); res.status(500).json({success:false,message:e.message});}
};
const updateAdminProduct = async (req, res) => {
    try { const {id}=req.params; if(isNaN(id)) return res.status(400).json({message:'ID inválido.'});
        const p=req.body; if(!p.Nombre||p.precio_unitario===undefined||p.cantidad===undefined||!p.Marca) return res.status(400).json({message:'Faltan datos.'});
        const pr=parseFloat(p.precio_unitario), cn=parseInt(p.cantidad,10), ci=p.ID_Categoria?parseInt(p.ID_Categoria,10):null;
        if(isNaN(pr)||pr<0||isNaN(cn)||cn<0||(p.ID_Categoria&&isNaN(ci))) return res.status(400).json({message:'Datos numéricos inválidos.'});
        const sql = `UPDATE producto SET Nombre=?,Descripcion=?,precio_unitario=?,Marca=?,Codigo_Barras=?,ID_Categoria=?,cantidad=?,imagen_url=?,imagen_url_2=?,imagen_url_3=?,imagen_url_4=?,imagen_url_5=? WHERE ID_Producto=?`;
        const v = [p.Nombre,p.Descripcion||null,pr,p.Marca,p.Codigo_Barras||null,ci,cn,p.imagen_url||null,p.imagen_url_2||null,p.imagen_url_3||null,p.imagen_url_4||null,p.imagen_url_5||null,id];
        const [re] = await dbPool.query(sql,v); if(re.affectedRows===0) return res.status(404).json({message:'Producto no encontrado.'});
        res.status(200).json({success:true,message:'Producto actualizado.'});
    } catch (e) { if(e.code==='ER_DUP_ENTRY') return res.status(409).json({message:'Cód. Barras duplicado.'}); res.status(500).json({success:false,message:e.message});}
};
const deleteAdminProduct = async (req, res) => {
    try { const {id}=req.params; if(isNaN(id)) return res.status(400).json({message:'ID inválido.'});
        const [re] = await dbPool.query('DELETE FROM producto WHERE ID_Producto=?',[id]);
        if(re.affectedRows===0) return res.status(404).json({message:'Producto no encontrado.'});
        res.status(200).json({success:true,message:'Producto eliminado.'});
    } catch (e) { if(e.code==='ER_ROW_IS_REFERENCED_2') return res.status(409).json({message:'Producto referenciado, no se puede eliminar.'}); res.status(500).json({success:false,message:e.message});}
};
const getAdminUsers = async (req, res) => {
    try { const [u] = await dbPool.query('SELECT id,username,email,role FROM usuarios ORDER BY id DESC'); res.status(200).json(u); }
    catch (e) { res.status(500).json({success:false,message:e.message});}
};
const getAdminSettings = async (req, res) => {
    // Aquí deberías devolver los settings globales (puedes modularizar siteSettings si lo necesitas)
    res.status(200).json({success:true, settings:{}});
};

// Analytics
const getSalesOverview = async (req, res) => {
    try {
        const [salesData] = await dbPool.query(`SELECT COALESCE(SUM(CASE WHEN Fecha_Pedido >= CURDATE() - INTERVAL 30 DAY THEN Total_Pedido ELSE 0 END), 0) as totalSales30Days, (SELECT COUNT(*) FROM pedidos) as totalOrders, (SELECT COUNT(*) FROM usuarios) as totalUsers FROM pedidos WHERE Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado')`);
        const [dailySales] = await dbPool.query(`SELECT DATE_FORMAT(Fecha_Pedido, '%Y-%m-%d') as dia, SUM(Total_Pedido) as total_ventas FROM pedidos WHERE Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado') AND Fecha_Pedido >= CURDATE() - INTERVAL 30 DAY GROUP BY dia ORDER BY dia ASC`);
        const [topProducts] = await dbPool.query(`SELECT p.Nombre, SUM(dp.Cantidad) as total_vendido FROM detalles_pedido dp JOIN producto p ON dp.ID_Producto = p.ID_Producto JOIN pedidos ped ON dp.ID_Pedido = ped.ID_Pedido WHERE ped.Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado') GROUP BY p.ID_Producto, p.Nombre ORDER BY total_vendido DESC LIMIT 5`);
        res.status(200).json({ kpis: salesData[0], dailySales, topProducts });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
const getProductViews = async (req, res) => {
    try {
        const [productViews] = await dbPool.query(`SELECT p.Nombre, COUNT(vp.ID_Vista) as total_vistas FROM vistas_producto vp JOIN producto p ON vp.ID_Producto = p.ID_Producto GROUP BY p.ID_Producto, p.Nombre ORDER BY total_vistas DESC LIMIT 10`);
        res.status(200).json({ success: true, views: productViews });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Mensajes
const getAdminMessages = async (req, res) => {
    try {
        const [messages] = await dbPool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        res.status(200).json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cargar los mensajes desde el servidor.' });
    }
};
const updateMessageStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['read', 'unread', 'archived'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }
    try {
        await dbPool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ success: true, message: `Mensaje actualizado a ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el estado del mensaje.' });
    }
};
const starMessage = async (req, res) => {
    const { id } = req.params;
    const { is_starred } = req.body;
    try {
        await dbPool.query('UPDATE contact_messages SET is_starred = ? WHERE id = ?', [is_starred, id]);
        res.status(200).json({ success: true, message: `Mensaje ${is_starred ? 'destacado' : 'des-destacado'}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al destacar el mensaje.' });
    }
};
const deleteMessage = async (req, res) => {
    const { id } = req.params;
    try {
        await dbPool.query('DELETE FROM contact_messages WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Mensaje eliminado permanentemente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar el mensaje.' });
    }
};

// Políticas y FAQ admin
const createPolicy = async (req, res) => {
    const { titulo, contenido } = req.body;
    const [result] = await dbPool.query('INSERT INTO politicas (titulo, contenido) VALUES (?, ?)', [titulo, contenido]);
    res.status(201).json({ success: true, id: result.insertId });
};
const deletePolicy = async (req, res) => {
    await dbPool.query('DELETE FROM politicas WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true });
};
const createFaq = async (req, res) => {
    const { pregunta, respuesta } = req.body;
    const [result] = await dbPool.query('INSERT INTO preguntas_frecuentes (pregunta, respuesta) VALUES (?, ?)', [pregunta, respuesta]);
    res.status(201).json({ success: true, id: result.insertId });
};
const deleteFaq = async (req, res) => {
    await dbPool.query('DELETE FROM preguntas_frecuentes WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true });
};
const updatePolicies = async (req, res) => {
    const { policies } = req.body;
    if (!Array.isArray(policies)) return res.status(400).json({ success: false, message: 'Formato inválido.' });
    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        for (const policy of policies) {
            await connection.query('UPDATE politicas SET titulo = ?, contenido = ? WHERE id = ?', [policy.titulo, policy.contenido, policy.id]);
        }
        await connection.commit();
        res.status(200).json({ success: true, message: 'Políticas actualizadas.' });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Error al actualizar políticas.' });
    } finally {
        if (connection) connection.release();
    }
};
const updateFaqs = async (req, res) => {
    const { faqs } = req.body;
    if (!Array.isArray(faqs)) return res.status(400).json({ success: false, message: 'Formato inválido.' });
    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        for (const faq of faqs) {
            await connection.query('UPDATE preguntas_frecuentes SET pregunta = ?, respuesta = ? WHERE id = ?', [faq.pregunta, faq.respuesta, faq.id]);
        }
        await connection.commit();
        res.status(200).json({ success: true, message: 'Preguntas Frecuentes actualizadas.' });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Error al actualizar las preguntas.' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
  getAdminProducts,
  getAdminProductById,
  addAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminUsers,
  getAdminSettings,
  getSalesOverview,
  getProductViews,
  getAdminMessages,
  updateMessageStatus,
  starMessage,
  deleteMessage,
  createPolicy,
  deletePolicy,
  createFaq,
  deleteFaq,
  updatePolicies,
  updateFaqs
};
