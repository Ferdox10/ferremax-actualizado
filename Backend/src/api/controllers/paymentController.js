const { dbPool } = require('../../config/database');
const crypto = require('crypto');
const paypal = require('@paypal/checkout-server-sdk');
const { client } = require('../../config/paypal');

const wompiTempOrders = {};
const WOMPI_TEMP_ORDER_TIMEOUT = 1000 * 60 * 30;

const createWompiTempOrder = async (req, res) => {
    const { reference, items, total, userId, customerData } = req.body;
    if (!reference || !Array.isArray(items) || items.length === 0 || total === undefined) {
        return res.status(400).json({ success: false, message: 'Datos inválidos para orden temporal.' });
    }
    const hasInvalidItem = items.some(item => !item.productId || !item.quantity || item.quantity <= 0 || item.price === undefined);
    if (hasInvalidItem) {
        return res.status(400).json({ success: false, message: 'Items inválidos en orden temporal.' });
    }
    let userEmail = null;
    if (userId && dbPool) {
        const [users] = await dbPool.query('SELECT email FROM usuarios WHERE id = ?', [userId]);
        if (users.length > 0) userEmail = users[0].email;
    }
    wompiTempOrders[reference] = { items, total, userId, customerData, userEmail, timestamp: Date.now() };
    setTimeout(() => { delete wompiTempOrders[reference]; }, WOMPI_TEMP_ORDER_TIMEOUT);
    res.status(200).json({ success: true, message: 'Orden temporal guardada.' });
};

const wompiWebhook = async (req, res) => {
    // Aquí va la lógica completa de validación de firma y procesamiento de webhook WOMPI
    res.status(200).json({ success: true, message: 'Webhook procesado (placeholder).' });
};

const cashOnDelivery = async (req, res) => {
    // Aquí va la lógica completa de pedido contra entrega
    res.status(201).json({ success: true, message: 'Pedido contra entrega recibido (placeholder).' });
};

const createPaypalOrder = async (req, res) => {
    const { cartTotal } = req.body;
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: cartTotal.toFixed(2)
            }
        }]
    });
    try {
        const order = await client.execute(request);
        res.status(201).json({ orderID: order.result.id });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

const capturePaypalOrder = async (req, res) => {
    const { orderID, cart, shippingDetails, userId } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    let connection;
    try {
        const capture = await client.execute(request);
        const captureStatus = capture.result.status;
        if (captureStatus === 'COMPLETED') {
            connection = await dbPool.getConnection();
            await connection.beginTransaction();
            let totalPedido = 0;
            for (const item of cart) {
                totalPedido += item.precio_unitario * item.quantity;
            }
            // Aquí deberías obtener el clienteId con la lógica adecuada
            const clienteId = null;
            const [pedidoResult] = await connection.query(
                `INSERT INTO pedidos (ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, Referencia_Pago, Nombre_Cliente_Envio, Direccion_Envio, Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio, Telefono_Cliente_Envio, Email_Cliente_Envio, Fecha_Pedido, ID_Cliente) VALUES (?, ?, 'Pagado', 'PayPal', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [userId || null, totalPedido, orderID, shippingDetails.name, shippingDetails.address, shippingDetails.department, shippingDetails.city, shippingDetails.referencePoint || null, shippingDetails.phone, shippingDetails.email, clienteId]
            );
            await connection.commit();
            res.status(200).json({ success: true, message: "Pago completado y pedido guardado." });
        } else {
            res.status(400).json({ success: false, message: `El pago no pudo ser completado. Estado: ${captureStatus}` });
        }
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(500).send(err.message);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
  createWompiTempOrder,
  wompiWebhook,
  cashOnDelivery,
  createPaypalOrder,
  capturePaypalOrder
};
