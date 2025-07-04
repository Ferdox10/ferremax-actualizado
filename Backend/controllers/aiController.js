// backend/controllers/aiController.js
const aiConfig = require('../config/ai');
const { getPool } = require('../config/database');

const chat = async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ success: false, message: "Mensaje vacío." });
    }

    const geminiModel = aiConfig.geminiModel;

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
        
        const [policiesDB] = await dbPool.query("SELECT titulo, contenido FROM politicas");
        const [faqsDB] = await dbPool.query("SELECT pregunta, respuesta FROM preguntas_frecuentes");
        const [productsDB] = await dbPool.query("SELECT ID_Producto, Nombre, Descripcion, precio_unitario, cantidad, Marca FROM producto LIMIT 10");

        const productContext = productsDB.map(p => `- ID:${p.ID_Producto}, Nombre:${p.Nombre}, Precio:${p.precio_unitario}, Stock:${p.cantidad}`).join('\n');
        const ferremaxPolicies = policiesDB.map(p => `- ${p.titulo}: ${p.contenido}`).join('\n');
        const ferremaxFaqs = faqsDB.map(f => `- P: ${f.pregunta}\n  R: ${f.respuesta}`).join('\n');
        
        const systemInstruction = `Eres Ferremax IA, un asistente experto de la ferretería Ferremax. Responde amistosamente y basa tus respuestas ESTRICTAMENTE en la información proporcionada. Si mencionas un producto, formatea un enlace Markdown: [Nombre del Producto](/products/ID_DEL_PRODUCTO).\n---\nPolíticas:\n${ferremaxPolicies}\n---\nFAQ:\n${ferremaxFaqs}\n---\nContexto de Productos:\n${productContext}\n---\nPregunta del cliente:`;
        
        // <-- LÍNEA QUE FALTABA Y SOLUCIONA EL ERROR
        const fullPrompt = `${systemInstruction}\n${userMessage}`;
        
        const chatSession = geminiModel.startChat({ });
        const result = await chatSession.sendMessage(fullPrompt); // Ahora 'fullPrompt' existe.
        const response = result.response;
        const aiReply = response.text();
        
        if (!aiReply) {
            throw new Error("El asistente no pudo generar una respuesta.");
        }
        
        res.json({ success: true, reply: aiReply });

    } catch (error) {
        console.error(`!!! Error en /api/ai-assistant/chat: ${error.toString()}`);
        const errorMessage = process.env.NODE_ENV === 'production' ? 'Ocurrió un error al procesar tu solicitud.' : error.message;
        res.status(500).json({ success: false, message: errorMessage });
    }
};

module.exports = { chat };