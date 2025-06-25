// backend/controllers/orderController.js
const crypto = require('crypto');
const { getPool } = require('../config/database');
const { WOMPI_EVENTS_SECRET } = require('../config/payment');
const { getOrCreateClienteId } = require('../models/client');
const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');

// Almacenamiento temporal de órdenes de Wompi
const wompiTempOrders = {};
const WOMPI_TEMP_ORDER_TIMEOUT = 1000 * 60 * 30; // 30 minutos

// Pedido contra entrega
const createCashOnDeliveryOrder = async (req, res) => {
    const dbPool = getPool();
    const { cart, customerInfo } = req.body;
    if (!cart || cart.length === 0 || !customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.department || !customerInfo.city || !customerInfo.email) {
        return res.status(400).json({ success: false, message: "Faltan datos del carrito o del cliente." });
    }
    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        let totalPedido = 0;
        for (const item of cart) {
            const [productDB] = await connection.query('SELECT Nombre, precio_unitario, cantidad FROM producto WHERE ID_Producto = ? FOR UPDATE', [item.productId]);
            if (productDB.length === 0) throw new Error(`Producto ID ${item.productId} no encontrado.`);
            if (productDB[0].cantidad < item.quantity) {
                throw new Error(`Stock insuficiente para ${productDB[0].Nombre}.`);
            }
            item.price = productDB[0].precio_unitario;
            totalPedido += item.price * item.quantity;
        }
        const clienteId = await getOrCreateClienteId(connection, { username: customerInfo.name, email: customerInfo.email });
        if (!clienteId) throw new Error(`No se pudo crear o encontrar un ID de cliente para el email ${customerInfo.email}`);
        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, Nombre_Cliente_Envio, Direccion_Envio, Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio, Telefono_Cliente_Envio, Email_Cliente_Envio, Fecha_Pedido, ID_Cliente) VALUES (?, ?, 'Pendiente de Confirmacion', 'ContraEntrega', ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [customerInfo.userId || null, totalPedido, customerInfo.name, customerInfo.address, customerInfo.department, customerInfo.city, customerInfo.complement || null, customerInfo.phone, customerInfo.email, clienteId]
        );
        const pedidoId = pedidoResult.insertId;
        for (const item of cart) {
            await connection.query('INSERT INTO detalles_pedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario_Compra) VALUES (?, ?, ?, ?)', [pedidoId, item.productId, item.quantity, item.price]);
            await connection.query('UPDATE producto SET cantidad = GREATEST(0, cantidad - ?) WHERE ID_Producto = ?', [item.quantity, item.productId]);
        }
        await connection.commit();
        res.status(201).json({ success: true, message: "Pedido contra entrega recibido exitosamente.", orderId: pedidoId });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(error.message.includes("Stock insuficiente") ? 409 : 500).json({ success: false, message: error.message || "Error interno al procesar el pedido." });
    } finally {
        if (connection) connection.release();
    }
};

// Guardar orden temporal WOMPI
const createWompiTempOrder = async (req, res) => {
    const dbPool = getPool();
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

// Webhook WOMPI
const handleWompiWebhook = async (req, res) => {
    const dbPool = getPool();
    const signatureReceived = req.body.signature?.checksum;
    const eventData = req.body.data?.transaction;
    const timestamp = req.body.timestamp;
    if (!signatureReceived || !eventData || !timestamp || !eventData.reference || eventData.amount_in_cents === undefined || !eventData.currency || !eventData.status) {
        return res.status(200).json({ success: false, message: "Payload inválido o incompleto." });
    }
    const transactionReference = eventData.reference;
    const transactionStatus = eventData.status;
    const amountInCents = eventData.amount_in_cents;
    const currency = eventData.currency;
    const stringToSign = `${transactionReference}${amountInCents}${currency}${transactionStatus}${timestamp}${WOMPI_EVENTS_SECRET}`;
    const expectedSignature = crypto.createHash('sha256').update(stringToSign).digest('hex');
    if (signatureReceived !== expectedSignature) {
        return res.status(200).json({ success: true, message: "Firma inválida." });
    }
    const orderDetails = wompiTempOrders[transactionReference];
    if (!orderDetails) {
        return res.status(200).json({ success: true, message: "Orden no encontrada o ya procesada/expirada." });
    }
    if (transactionStatus === 'APPROVED') {
        let connection;
        try {
            connection = await dbPool.getConnection();
            await connection.beginTransaction();
            for (const item of orderDetails.items) {
                const [productDB] = await connection.query('SELECT cantidad FROM producto WHERE ID_Producto = ? FOR UPDATE', [item.productId]);
                if (productDB.length === 0 || productDB[0].cantidad < item.quantity) {
                    throw new Error('Stock insuficiente o producto no encontrado.');
                }
            }
            // Aquí deberías obtener el email del cliente y el clienteId
            const clienteId = await getOrCreateClienteId(connection, { username: orderDetails.customerData?.name, email: orderDetails.customerData?.email });
            const [pedidoResult] = await connection.query(
                `INSERT INTO pedidos (ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, Referencia_Pago, Nombre_Cliente_Envio, Email_Cliente_Envio, Telefono_Cliente_Envio, Direccion_Envio, Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio, Fecha_Pedido, ID_Cliente) VALUES (?, ?, 'Pagado', 'Wompi', ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [orderDetails.userId || null, orderDetails.total, transactionReference, orderDetails.customerData?.name, orderDetails.customerData?.email, orderDetails.customerData?.phone, orderDetails.customerData?.address, orderDetails.customerData?.department, orderDetails.customerData?.city, orderDetails.customerData?.complement || null, clienteId]
            );
            const pedidoId = pedidoResult.insertId;
            for (const item of orderDetails.items) {
                await connection.query('INSERT INTO detalles_pedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario_Compra) VALUES (?, ?, ?, ?)', [pedidoId, item.productId, item.quantity, item.price]);
                await connection.query('UPDATE producto SET cantidad = GREATEST(0, cantidad - ?) WHERE ID_Producto = ?', [item.quantity, item.productId]);
            }
            await connection.commit();
            delete wompiTempOrders[transactionReference];
            res.status(200).json({ success: true, message: `Webhook procesado. Estado: ${transactionStatus}` });
        } catch (dbError) {
            if (connection) await connection.rollback();
            res.status(200).json({ success: true, message: "Error interno DB." });
        } finally {
            if (connection) connection.release();
        }
    } else {
        if (["DECLINED", "VOIDED", "ERROR"].includes(transactionStatus)) {
            delete wompiTempOrders[transactionReference];
        }
        res.status(200).json({ success: true, message: `Webhook procesado. Estado: ${transactionStatus}` });
    }
};

// Historial de pedidos de usuario
const getUserOrders = async (req, res) => {
    const dbPool = getPool();
    const userId = req.userId;
    try {
        const [pedidos] = await dbPool.query(`SELECT p.ID_Pedido, p.Fecha_Pedido, p.Total_Pedido, p.Estado_Pedido, p.Metodo_Pago, p.Referencia_Pago FROM pedidos p WHERE p.ID_Usuario = ? ORDER BY p.Fecha_Pedido DESC`, [userId]);
        if (pedidos.length === 0) {
            return res.status(200).json({ success: true, orders: [] });
        }
        const ordersWithDetails = await Promise.all(
            pedidos.map(async (pedido) => {
                const [detalles] = await dbPool.query(`SELECT dp.ID_Producto, prod.Nombre as name, prod.imagen_url as imageUrl, dp.Cantidad as quantity, dp.Precio_Unitario_Compra as pricePaid FROM detalles_pedido dp JOIN producto prod ON dp.ID_Producto = prod.ID_Producto WHERE dp.ID_Pedido = ?`, [pedido.ID_Pedido]);
                return { ...pedido, items: detalles };
            })
        );
        res.status(200).json({ success: true, orders: ordersWithDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el historial de compras.' });
    }
};

// Crear orden PayPal
const createPaypalOrder = async (req, res) => {
    const { cartTotal } = req.body;
    const { paypalClient } = require('../config/payment');
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: cartTotal.toFixed(2) } }]
    });
    try {
        const order = await paypalClient.execute(request);
        res.status(201).json({ orderID: order.result.id });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Capturar orden PayPal
const capturePaypalOrder = async (req, res) => {
    const { orderID, cart, shippingDetails, userId } = req.body;
    const { paypalClient } = require('../config/payment');
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    let connection;
    try {
        const capture = await paypalClient.execute(request);
        const captureStatus = capture.result.status;
        if (captureStatus === 'COMPLETED') {
            connection = await getPool().getConnection();
            await connection.beginTransaction();
            let totalPedido = 0;
            for (const item of cart) {
                const [productDB] = await connection.query('SELECT Nombre, precio_unitario, cantidad FROM producto WHERE ID_Producto = ? FOR UPDATE', [item.productId]);
                if (productDB.length === 0) throw new Error(`Producto ID ${item.productId} no encontrado.`);
                if (productDB[0].cantidad < item.quantity) {
                    throw new Error(`Stock insuficiente para ${productDB[0].Nombre}.`);
                }
                item.price = productDB[0].precio_unitario;
                totalPedido += item.price * item.quantity;
            }
            const clienteId = await getOrCreateClienteId(connection, { username: shippingDetails.name, email: shippingDetails.email });
            const [pedidoResult] = await connection.query(
                `INSERT INTO pedidos (ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, Referencia_Pago, Nombre_Cliente_Envio, Direccion_Envio, Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio, Telefono_Cliente_Envio, Email_Cliente_Envio, Fecha_Pedido, ID_Cliente) VALUES (?, ?, 'Pagado', 'PayPal', ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [userId || null, totalPedido, orderID, shippingDetails.name, shippingDetails.address, shippingDetails.department, shippingDetails.city, shippingDetails.referencePoint || null, shippingDetails.phone, shippingDetails.email, clienteId]
            );
            const pedidoId = pedidoResult.insertId;
            for (const item of cart) {
                await connection.query('INSERT INTO detalles_pedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario_Compra) VALUES (?, ?, ?, ?)', [pedidoId, item.productId, item.quantity, item.price]);
                await connection.query('UPDATE producto SET cantidad = GREATEST(0, cantidad - ?) WHERE ID_Producto = ?', [item.quantity, item.productId]);
            }
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
    createCashOnDeliveryOrder,
    createWompiTempOrder,
    handleWompiWebhook,
    getUserOrders,
    createPaypalOrder,
    capturePaypalOrder
};