const paypal = require('@paypal/checkout-server-sdk');

const environment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);
console.log("--> Cliente de PayPal configurado para entorno de Producción (Live).");

module.exports = client;
