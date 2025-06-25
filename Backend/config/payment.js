// backend/config/payment.js
const paypal = require('@paypal/checkout-server-sdk');

// --- WOMPI CONFIG ---
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET;

if (!WOMPI_PUBLIC_KEY || !WOMPI_PRIVATE_KEY || !WOMPI_EVENTS_SECRET) {
    console.error("\n!!! ERROR: Faltan variables de entorno críticas de WOMPI.\n");
}
console.log(`--> Llave Pública Wompi (Backend): ...${WOMPI_PUBLIC_KEY ? WOMPI_PUBLIC_KEY.slice(-6) : 'NO DEFINIDA'}`);

// --- PAYPAL CONFIG ---
const environment = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const paypalClient = new paypal.core.PayPalHttpClient(environment);
console.log(`--> Cliente de PayPal configurado para entorno: ${process.env.NODE_ENV || 'development'}.`);


module.exports = {
    WOMPI_PUBLIC_KEY,
    WOMPI_PRIVATE_KEY,
    WOMPI_EVENTS_SECRET,
    paypalClient
};