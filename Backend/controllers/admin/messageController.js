// Controlador de mensajes de contacto para admin
const { getPool } = require('../../config/database');
const nodemailer = require('nodemailer');

// Configuración de nodemailer (debería estar en config/mailer.js, aquí solo ejemplo)
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASS ? nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
    },
}) : null;

// Listar mensajes de contacto
const getAllMessages = async (req, res) => {
    const dbPool = getPool();
    try {
        const [messages] = await dbPool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        res.status(200).json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cargar los mensajes desde el servidor.' });
    }
};

// Responder mensaje por correo
const replyToMessage = async (req, res) => {
    const { recipientEmail, subject, body } = req.body;
    if (!transporter) {
        return res.status(503).json({ success: false, message: 'El servicio de correo no está configurado en el servidor.' });
    }
    if (!recipientEmail || !subject || !body) {
        return res.status(400).json({ success: false, message: 'Faltan datos para enviar la respuesta.' });
    }
    const mailOptions = {
        from: `"Ferremax" <${process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject: `Re: ${subject}`,
        html: `<p>Hola,</p><p>Gracias por contactar a Ferremax. Aquí tienes la respuesta a tu consulta:</p><blockquote style='border-left:2px solid #ccc;padding-left:1em;margin-left:1em;color:#555;'>${body}</blockquote><p>Saludos,<br>El equipo de Ferremax</p>`
    };
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ success: true, message: 'Respuesta enviada con éxito.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al enviar el correo.' });
    }
};

// Actualizar estado de mensaje (leído, archivado)
const updateMessageStatus = async (req, res) => {
    const dbPool = getPool();
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

// Destacar/des-destacar mensaje
const toggleMessageStar = async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    const { is_starred } = req.body;
    try {
        await dbPool.query('UPDATE contact_messages SET is_starred = ? WHERE id = ?', [is_starred, id]);
        res.status(200).json({ success: true, message: `Mensaje ${is_starred ? 'destacado' : 'des-destacado'}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al destacar el mensaje.' });
    }
};

// Eliminar mensaje
const deleteMessage = async (req, res) => {
    const dbPool = getPool();
    const { id } = req.params;
    try {
        await dbPool.query('DELETE FROM contact_messages WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Mensaje eliminado permanentemente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar el mensaje.' });
    }
};

module.exports = { getAllMessages, replyToMessage, updateMessageStatus, toggleMessageStar, deleteMessage };
