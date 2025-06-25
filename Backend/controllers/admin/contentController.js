const { getPool } = require('../../config/database');

// Crear política
const createPolicy = async (req, res) => {
    const dbPool = getPool();
    const { titulo, contenido } = req.body;
    try {
        const [result] = await dbPool.query('INSERT INTO politicas (titulo, contenido) VALUES (?, ?)', [titulo, contenido]);
        res.status(201).json({ success: true, id: result.insertId });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Actualizar políticas (array)
const updatePolicies = async (req, res) => {
    const dbPool = getPool();
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

// Eliminar política
const deletePolicy = async (req, res) => {
    const dbPool = getPool();
    try {
        await dbPool.query('DELETE FROM politicas WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Crear FAQ
const createFaq = async (req, res) => {
    const dbPool = getPool();
    const { pregunta, respuesta } = req.body;
    try {
        const [result] = await dbPool.query('INSERT INTO preguntas_frecuentes (pregunta, respuesta) VALUES (?, ?)', [pregunta, respuesta]);
        res.status(201).json({ success: true, id: result.insertId });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Actualizar FAQs (array)
const updateFaqs = async (req, res) => {
    const dbPool = getPool();
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

// Eliminar FAQ
const deleteFaq = async (req, res) => {
    const dbPool = getPool();
    try {
        await dbPool.query('DELETE FROM preguntas_frecuentes WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = { createPolicy, updatePolicies, deletePolicy, createFaq, updateFaqs, deleteFaq };
