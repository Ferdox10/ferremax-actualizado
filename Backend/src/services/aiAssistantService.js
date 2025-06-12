const { GoogleGenerativeAI } = require('@google/generative-ai');
const { dbPool } = require('../config/database');

let genAI;
let geminiModel;

if (process.env.GOOGLE_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    } catch (e) {
        geminiModel = null;
    }
} else {
    geminiModel = null;
}

const getGeminiResponse = async (userMessage) => {
    if (!geminiModel) throw new Error('Asistente IA no disponible.');
    if (!dbPool) throw new Error('Conexión a BD no disponible.');
    const [policiesDB] = await dbPool.query('SELECT titulo, contenido FROM politicas');
    const [faqsDB] = await dbPool.query('SELECT pregunta, respuesta FROM preguntas_frecuentes');
    const [productsDB] = await dbPool.query('SELECT ID_Producto, Nombre, Descripcion, precio_unitario, cantidad, Marca FROM producto LIMIT 10');
    const productContext = productsDB.map(p => `- ID:${p.ID_Producto}, Nombre:${p.Nombre}, Precio:${p.precio_unitario}, Stock:${p.cantidad}`).join('\n');
    const ferremaxPolicies = policiesDB.map(p => `- ${p.titulo}: ${p.contenido}`).join('\n');
    const ferremaxFaqs = faqsDB.map(f => `- P: ${f.pregunta}\n  R: ${f.respuesta}`).join('\n');
    const systemInstruction = `Eres Ferremax IA, un asistente experto de la ferretería Ferremax. Responde amistosamente y basa tus respuestas ESTRICTAMENTE en la información proporcionada. Si mencionas un producto, formatea un enlace Markdown: [Nombre del Producto](/products/ID_DEL_PRODUCTO).\n---\nPolíticas:\n${ferremaxPolicies}\n---\nFAQ:\n${ferremaxFaqs}\n---\nContexto de Productos:\n${productContext}\n---\nPregunta del cliente:`;
    const fullPrompt = `${systemInstruction}\n${userMessage}`;
    const chatSession = geminiModel.startChat({});
    const result = await chatSession.sendMessage(fullPrompt);
    const response = result.response;
    const aiReply = response.text();
    if (!aiReply) throw new Error('El asistente no pudo generar una respuesta.');
    return aiReply;
};

module.exports = { getGeminiResponse };
