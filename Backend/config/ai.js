// backend/config/ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
let geminiModel = null;

function initializeAI() {
    if (process.env.GOOGLE_API_KEY) {
        try {
            genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
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