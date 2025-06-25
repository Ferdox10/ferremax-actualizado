// backend/services/whatsappService.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Solo inicializar si las credenciales existen
const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

if (!client) {
    console.warn("!!! Credenciales de Twilio no configuradas. El servicio de WhatsApp no funcionará.");
}

/**
 * Envía una notificación de confirmación de pedido por WhatsApp.
 * @param {object} orderData - Los datos del pedido.
 * @param {string} orderData.customerPhone - El número de teléfono del cliente (ej. '3001234567').
 * @param {string} orderData.customerName - El nombre del cliente.
 * @param {string|number} orderData.orderId - El ID del pedido.
 * @param {Array<object>} orderData.items - Un array con los productos del pedido.
 * @param {number} orderData.total - El total del pedido.
 */
async function sendOrderConfirmation(orderData) {
    if (!client) {
        console.log("-> Intento de envío de WhatsApp omitido (servicio no configurado).");
        return;
    }

    try {
        // Formatear la lista de productos para que sea legible en el mensaje
        const itemsSummary = orderData.items.map(item => 
            `- ${item.quantity}x ${item.name || item.Nombre} ($${(item.price || item.precio_unitario).toLocaleString('es-CO')})`
        ).join('\n');

        // IMPORTANTE: El número debe estar en formato E.164 y tener el prefijo 'whatsapp:'
        // Asumimos que el número del cliente es de Colombia (+57) si no tiene prefijo.
        // ¡Debes ajustar esta lógica si tienes clientes internacionales!
        const formattedCustomerPhone = `whatsapp:+57${orderData.customerPhone.replace(/[^0-9]/g, '')}`;

        console.log(`--> Intentando enviar confirmación de pedido por WhatsApp a ${formattedCustomerPhone}`);

        const message = await client.messages.create({
            from: twilioWhatsappNumber,
            to: formattedCustomerPhone,
            // Este es el cuerpo completo que coincide con la plantilla que creaste.
            // Twilio es inteligente y sabe qué plantilla usar si el texto coincide.
            body: `¡Hola, ${orderData.customerName}! 👋 Tu pedido #${orderData.orderId} en Ferremax ha sido recibido con éxito.\n\nResumen de tu compra:\n${itemsSummary}\n\nTotal: $${orderData.total.toLocaleString('es-CO')}\n\n¡Gracias por tu compra! Prepararemos tu pedido para el envío lo antes posible.`
        });

        console.log(`--> Mensaje de WhatsApp enviado con éxito. SID: ${message.sid}`);

    } catch (error) {
        console.error(`!!! Error al enviar mensaje de WhatsApp a ${orderData.customerPhone}:`, error.message);
        // No relanzamos el error para no interrumpir el flujo de la compra si solo falla el WhatsApp.
    }
}

module.exports = { sendOrderConfirmation };