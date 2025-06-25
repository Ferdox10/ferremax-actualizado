// backend/controllers/aiController.js

// ANTES (El problema está aquí)
// const { geminiModel } = require('../config/ai');

// DESPUÉS (La solución)
const aiConfig = require('../config/ai'); // Importamos el objeto completo
const { getPool } = require('../config/database');

const chat = async (req, res) => {
    // ... el resto de tu código de validación inicial ...
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ success: false, message: "Mensaje vacío." });
    }

    // AHORA accedemos a la propiedad a través del objeto importado
    const geminiModel = aiConfig.geminiModel; // Esto llamará al getter y obtendrá el valor actualizado

    if (!geminiModel) {
        console.error(`!!! Error IA: geminiModel no está inicializado. Revisa los logs de arranque del servidor.`);
        return res.status(503).json({ success: false, message: "Asistente IA no disponible. Contacta al administrador." });
    }

    try {
        const dbPool = getPool();
        if (!dbPool) {
            console.error('!!! Error IA: dbPool no está disponible.');
            return res.status(500).json({ success: false, message: "Error interno: Conexión a BD no disponible." });
        }
        
        // El resto de tu lógica permanece exactamente igual
        const [policiesDB] = await dbPool.query("SELECT titulo, contenido FROM politicas");
        // ... etc ...
        const chatSession = geminiModel.startChat({ });
        const result = await chatSession.sendMessage(fullPrompt);
        const response = result.response;
        const aiReply = response.text();
        
        if (!aiReply) {
            throw new Error("El asistente no pudo generar una respuesta.");
        }
        
        res.json({ success: true, reply: aiReply });

    } catch (error) {
        console.error('!!! Error en /api/ai-assistant/chat:', error);
        const errorMessage = process.env.NODE_ENV === 'production' ? 'Ocurrió un error al procesar tu solicitud.' : error.message;
        res.status(500).json({ success: false, message: errorMessage });
    }
};

module.exports = { chat };