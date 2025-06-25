// backend/config/ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
let geminiModel = null;

function initializeAI() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
        try {
            const maskedKey = apiKey.length > 8 ? apiKey.slice(0, 4) + '...' + apiKey.slice(-4) : '****';
            console.log(`--> GOOGLE_API_KEY detectada: ${maskedKey} (longitud: ${apiKey.length})`);
            genAI = new GoogleGenerativeAI(apiKey);
            geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            console.log("--> SDK de Google AI (Gemini) inicializado correctamente.");
        } catch (e) {
            console.error("!!! Error al inicializar GoogleGenerativeAI. Verifica tu GOOGLE_API_KEY y la configuración del SDK:", e);
            geminiModel = null;
        }
    } else {
        console.warn("!!! GOOGLE_API_KEY no está configurada. El asistente IA con Gemini no funcionará.");
    }
}

module.exports = { initializeAI, get genAI() { return genAI; }, get geminiModel() { return geminiModel; } };