// server.js - Servidor Backend Unificado para Ferremax con Wompi, Admin CRUD y Personalización
// Versión que lee la configuración de la DB desde variables de entorno estándar (.env localmente)
// Añadido SSL para conexión a TiDB Cloud
// *** Añadido soporte para 5 imágenes de producto y nuevas funcionalidades de admin ***
// *** Actualizado para manejar campos de dirección detallados en Pago Contra Entrega ***

// --- DEPENDENCIAS ---
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

// --- CONFIGURACIÓN GENERAL ---
const app = express();
const PORT = process.env.PORT || 4000;
const saltRounds = 10;
const isProduction = process.env.NODE_ENV === 'production';

// --- CONFIGURACIÓN WOMPI y FRONTEND URL ---
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!WOMPI_PUBLIC_KEY || !WOMPI_PRIVATE_KEY || !WOMPI_EVENTS_SECRET || !FRONTEND_URL) {
    console.error("\n!!! ERROR FATAL: Faltan variables de entorno críticas (WOMPI_*, FRONTEND_URL) en la configuración del servicio.\n");
    if (isProduction) process.exit(1);
}

console.log(`--> Llave Pública Wompi (Backend): ...${WOMPI_PUBLIC_KEY ? WOMPI_PUBLIC_KEY.slice(-6) : 'NO DEFINIDA'}`);
console.log(`--> URL Frontend para Redirección: ${FRONTEND_URL || 'NO DEFINIDA'}`);
console.log(`--> Entorno Node.js: ${process.env.NODE_ENV || 'development (default)'}`);

// --- CONFIGURACIÓN DEL SITIO DESDE BASE DE DATOS ---
let siteSettings = {}; // Inicializar como objeto vacío

async function loadSiteSettingsFromDB() {
    console.log("--> Cargando siteSettings desde la base de datos...");
    try {
        if (!dbPool) {
            console.error("!!! dbPool no está inicializado. No se pueden cargar settings.");
            throw new Error("Conexión a BD no disponible para cargar settings.");
        }
        const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM site_settings');
        rows.forEach(row => {
            siteSettings[row.setting_key] = row.setting_value;
        });

        const defaultSettings = {
            colorPrimary: '#ea580c', colorSecondary: '#047857', colorAccent: '#f1f5f9',
            welcomeTitle: 'Bienvenido a Ferremax', promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
            promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!',
            contactAddress: 'Calle Falsa 123, Barranquilla, Colombia', contactPhone: '+57 300 123 4567',
            contactEmail: 'info@ferremax.example.com', socialFacebook: '', socialTwitter: '',
            socialInstagram: '', socialYoutube: ''
        };

        let updatedDefaultsInDB = false;
        for (const key in defaultSettings) {
            if (siteSettings[key] === undefined) {
                siteSettings[key] = defaultSettings[key];
                try {
                    await dbPool.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, defaultSettings[key], defaultSettings[key]]);
                    updatedDefaultsInDB = true;
                } catch (dbError) {
                    console.error(`Error al insertar default setting ${key} en BD:`, dbError);
                }
            }
        }
        if (updatedDefaultsInDB) console.log("--> Algunos settings por defecto fueron guardados en BD.");
        console.log("--> Configuración del sitio cargada desde BD (o defaults aplicados):", Object.keys(siteSettings).length > 0 ? "OK" : "VACÍA/FALLÓ");

    } catch (error) {
        console.error("!!! Error CRÍTICO al cargar siteSettings desde la DB. Usando defaults en memoria:", error);
        siteSettings = { // Fallback a defaults en memoria
            colorPrimary: '#ea580c', colorSecondary: '#047857', colorAccent: '#f1f5f9',
            welcomeTitle: 'Bienvenido a Ferremax', promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
            promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!',
            contactAddress: 'Calle Falsa 123, Barranquilla, Colombia', contactPhone: '+57 300 123 4567',
            contactEmail: 'info@ferremax.example.com', socialFacebook: '', socialTwitter: '',
            socialInstagram: '', socialYoutube: ''
        };
    }
}

// --- ALMACENAMIENTO TEMPORAL PARA ÓRDENES WOMPI ---
const wompiTempOrders = {};
const WOMPI_TEMP_ORDER_TIMEOUT = 1000 * 60 * 30; // 30 minutos

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONEXIÓN BASE DE DATOS (Con SSL para TiDB Cloud) ---
let dbPool;

async function initializeApp() {
    try {
        console.log("Intentando conectar a la DB usando variables de entorno estándar...");
        dbPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA, rejectUnauthorized: true } : (isProduction ? { rejectUnauthorized: true } : null)
        });

        const connection = await dbPool.getConnection();
        console.log(`--> Conexión exitosa a la base de datos '${connection.config.database}' en ${connection.config.host}:${connection.config.port}`);
        connection.release();

        await loadSiteSettingsFromDB(); 

    } catch (error) {
        console.error("!!! Error CRÍTICO al inicializar la aplicación (DB o Settings):", error);
        if (isProduction) process.exit(1);
    }
}

// --- MIDDLEWARE DE AUTENTICACIÓN ADMIN ---
const checkAdmin = (req, res, next) => {
    const isAdminSimulated = req.headers['x-admin-simulated'] === 'true';
    if (isAdminSimulated) {
        next();
    } else {
        console.warn(`\t[Admin Check] Acceso DENEGADO a ruta admin ${req.method} ${req.path}.`);
        res.status(403).json({ success: false, message: 'Acceso prohibido. Se requieren permisos de administrador.' });
    }
};


// ------------------------------------------------------
// --- RUTAS ---
// ------------------------------------------------------

// --- RUTA PARA CONFIGURACIÓN DEL FRONTEND ---
app.get('/api/config', (req, res) => {
    console.log("--> GET /api/config");
    try {
        res.status(200).json({
            success: true,
            wompiPublicKey: WOMPI_PUBLIC_KEY,
            frontendBaseUrl: FRONTEND_URL
        });
        console.log("\t<-- Enviando configuración pública al frontend.");
    } catch (error) {
        console.error("!!! Error en /api/config:", error);
        res.status(500).json({ success: false, message: 'Error al obtener la configuración.' });
    }
});

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/register', async (req, res) => {
    console.log("--> POST /register");
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password || password.length < 6) {
            console.warn("\tRegistro fallido: Datos inválidos.");
            return res.status(400).json({ success: false, message: 'Datos de registro inválidos.' });
        }
        const [existingUser] = await dbPool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (existingUser.length > 0) {
            console.warn(`\tRegistro fallido: Correo ya existe (${email})`);
            return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await dbPool.query(
            'INSERT INTO usuarios (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'cliente']
        );
        console.log(`\t<-- Usuario registrado: ${username} (ID: ${result.insertId})`);
        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('!!! Error en /register:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor durante el registro.' });
    }
});

app.post('/login', async (req, res) => {
    console.log("--> POST /login");
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.warn("\tLogin fallido: Faltan credenciales.");
            return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos.' });
        }
        const [users] = await dbPool.query(
            'SELECT id, username, email, password, role FROM usuarios WHERE email = ? LIMIT 1',
            [email]
        );
        if (users.length === 0) {
            console.warn(`\tLogin fallido: Usuario no encontrado (${email})`);
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            console.log(`\t<-- Login OK: ${user.username} (Rol: ${user.role})`);
            res.status(200).json({
                success: true,
                message: 'Login exitoso.',
                user: { id: user.id, username: user.username, email: user.email, role: user.role || 'cliente' }
            });
        } else {
            console.warn(`\tLogin fallido: Contraseña incorrecta para ${email}`);
            res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }
    } catch (error) {
        console.error('!!! Error en /login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor durante el login.' });
    }
});


// --- RUTAS PÚBLICAS (PRODUCTOS, CATEGORÍAS, CONTACTO) ---
app.get('/api/productos', async (req, res) => {
    console.log("--> GET /api/productos");
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    try {
        let sql = 'SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 FROM producto';
        if (limit && Number.isInteger(limit) && limit > 0) {
            sql += ` LIMIT ${limit}`; 
        }
        const [results] = await dbPool.query(sql);
        console.log(`\t<-- Devolviendo ${results.length} productos públicos`);
        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error GET /api/productos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los productos.' });
    }
});

app.get('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`--> GET /api/productos/${id}`);
    if (isNaN(id)) {
        console.warn("\tSolicitud rechazada: ID inválido.");
        return res.status(400).json({ success: false, message: 'El ID del producto debe ser un número.' });
    }
    try {
        const [results] = await dbPool.query(
            'SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 FROM producto WHERE ID_Producto = ?',
            [id]
        );
        if (results.length === 0) {
            console.log(`\t<-- Producto público ID ${id} no encontrado`);
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        console.log(`\t<-- Devolviendo detalles del producto público ID ${id}`);
        res.status(200).json(results[0]);
    } catch (error) {
        console.error(`!!! Error GET /api/productos/${id}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener el detalle del producto.' });
    }
});

app.get('/api/categories', async (req, res) => {
    console.log("--> GET /api/categories");
    try {
        const [results] = await dbPool.query('SELECT ID_Categoria, Nombre FROM categoria ORDER BY Nombre ASC');
        console.log(`\t<-- Devolviendo ${results.length} categorías`);
        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error GET /api/categories:', error.message);
        res.status(500).json({ success: false, message: 'Error al obtener las categorías.' });
    }
});

app.post('/api/contact', async (req, res) => {
    console.log("--> POST /api/contact");
    try {
        const { name, email, subject, message } = req.body; // subject is received but not used in INSERT
        if (!name || !email || !message) {
            console.warn("\tMensaje de contacto: Faltan datos requeridos.");
            return res.status(400).json({ success: false, message: "Nombre, email y mensaje son requeridos." });
        }
        await dbPool.query(
            'INSERT INTO contact_messages (name, email, message, subject, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, message, subject || null] 
        );
        console.log(`\t<-- Mensaje de contacto de ${name} <${email}> guardado en BD.`);
        res.status(200).json({ success: true, message: '¡Mensaje recibido! Gracias por contactarnos.' });
    } catch (error) {
        console.error("!!! Error al guardar mensaje de contacto:", error);
        res.status(500).json({ success: false, message: "Error interno al procesar el mensaje." });
    }
});

app.post('/api/products/:id/view', async (req, res) => {
    const { id: productId } = req.params;
    if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'ID de producto inválido.' });
    }
    try {
        const [productExists] = await dbPool.query('SELECT ID_Producto FROM producto WHERE ID_Producto = ?', [productId]);
        if (productExists.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        await dbPool.query('INSERT INTO vistas_producto (ID_Producto, Fecha_Vista) VALUES (?, NOW())', [productId]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(`!!! Error al registrar vista para producto ID ${productId}:`, error);
        res.status(500).json({ success: false, message: 'Error interno al registrar la vista.' });
    }
});


// --- RUTAS WOMPI ---
app.post('/api/wompi/temp-order', async (req, res) => {
    const { reference, items, total, userId, customerData } = req.body; 
    console.log(`--> POST /api/wompi/temp-order (Ref: ${reference})`);
    if (!reference || !Array.isArray(items) || items.length === 0 || total === undefined) {
        console.warn("\tSolicitud rechazada: Datos inválidos para orden temporal.");
        return res.status(400).json({ success: false, message: 'Datos inválidos para orden temporal.' });
    }
    const hasInvalidItem = items.some(item => !item.productId || !item.quantity || item.quantity <= 0 || item.price === undefined);
    if (hasInvalidItem) {
        console.warn("\tSolicitud rechazada: Items inválidos en orden temporal.");
        return res.status(400).json({ success: false, message: 'Items inválidos en orden temporal.' });
    }
    wompiTempOrders[reference] = { items, total, userId, customerData, timestamp: Date.now() };
    console.log(`\t<-- Orden temporal guardada para Ref: ${reference}`);
    setTimeout(() => {
        if (wompiTempOrders[reference]) {
            console.log(`\t[Cleanup] Eliminando orden temporal expirada: ${reference}`);
            delete wompiTempOrders[reference];
        }
    }, WOMPI_TEMP_ORDER_TIMEOUT);
    res.status(200).json({ success: true, message: 'Orden temporal guardada.' });
});

app.post('/api/wompi/webhook', async (req, res) => {
    console.log("--> POST /api/wompi/webhook (Notificación Wompi recibida)");
    const signatureReceived = req.body.signature?.checksum;
    const eventData = req.body.data?.transaction;
    const timestamp = req.body.timestamp;

    if (!signatureReceived || !eventData || !timestamp || !eventData.reference || eventData.amount_in_cents === undefined || !eventData.currency || !eventData.status) {
        console.warn("\t[Webhook Wompi] Rechazado: Payload inválido o incompleto.");
        return res.status(200).json({ success: false, message: "Payload inválido o incompleto." }); 
    }

    const transactionReference = eventData.reference;
    const transactionStatus = eventData.status;
    const amountInCents = eventData.amount_in_cents;
    const currency = eventData.currency;
    const stringToSign = `${transactionReference}${amountInCents}${currency}${transactionStatus}${timestamp}${WOMPI_EVENTS_SECRET}`;
    const expectedSignature = crypto.createHash('sha256').update(stringToSign).digest('hex');

    console.log(`\tRef: ${transactionReference}, Status: ${transactionStatus}, Amount: ${amountInCents} ${currency}`);
    if (signatureReceived !== expectedSignature) {
        console.error(`\t!!! [Webhook Wompi] FIRMA INVÁLIDA para Ref: ${transactionReference}. ¡POSIBLE FRAUDE!`);
        return res.status(200).json({ success: true, message: "Firma inválida." });
    }
    console.log(`\t[Webhook Wompi] Firma VÁLIDA para Ref: ${transactionReference}`);

    const orderDetails = wompiTempOrders[transactionReference];
    if (!orderDetails) {
        console.warn(`\t[Webhook Wompi] No se encontraron datos temporales para Ref: ${transactionReference}. Pudo expirar, ser procesada ya, o ser una transacción antigua/inválida.`);
        return res.status(200).json({ success: true, message: "Orden no encontrada o ya procesada/expirada." });
    }

    if (transactionStatus === 'APPROVED') {
        console.log(`\t[Webhook Wompi] Transacción APROBADA para Ref: ${transactionReference}. Intentando actualizar stock y guardar pedido...`);
        let connection;
        let updateFailed = false;
        let failureMessage = '';

        try {
            connection = await dbPool.getConnection();
            await connection.beginTransaction();
            console.log("\t\tIniciando transacción DB para actualizar stock y guardar pedido...");

            for (const item of orderDetails.items) {
                const [updateResult] = await connection.query(
                    'UPDATE producto SET cantidad = GREATEST(0, cantidad - ?) WHERE ID_Producto = ? AND cantidad >= ?',
                    [item.quantity, item.productId, item.quantity]
                );
                if (updateResult.affectedRows === 0) {
                    const [checkProduct] = await connection.query('SELECT Nombre, cantidad FROM producto WHERE ID_Producto = ?', [item.productId]);
                    const productName = checkProduct.length > 0 ? checkProduct[0].Nombre : `ID ${item.productId}`;
                    const currentStock = checkProduct.length > 0 ? checkProduct[0].cantidad : 'N/A';
                    failureMessage = `No se pudo actualizar stock para "${productName}". Stock actual: ${currentStock}, Se intentó restar: ${item.quantity}.`;
                    updateFailed = true;
                    break;
                }
            }

            if (updateFailed) {
                await connection.rollback();
                console.error(`\t\t!!! Rollback DB ejecutado (actualización de stock fallida) para Ref: ${transactionReference} debido a: ${failureMessage}`);
            } else {
                console.log("\t\tStock actualizado correctamente.");
                const tempOrderData = wompiTempOrders[transactionReference];
                const userId = tempOrderData?.userId || null;
                const nombreClienteEnvio = tempOrderData?.customerData?.fullName || eventData.customer_email || 'Cliente Wompi';
                const emailClienteEnvio = eventData.customer_email || tempOrderData?.customerData?.email || 'N/A';
                const telefonoClienteEnvio = tempOrderData?.customerData?.phoneNumber || 'N/A';
                const direccionEnvio = `${eventData.shipping_address?.address_line_1 || ''} ${eventData.shipping_address?.city || ''}`.trim() || tempOrderData?.customerData?.address || 'N/A';


                const [pedidoResult] = await connection.query(
                    `INSERT INTO pedidos (ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, Referencia_Pago, Nombre_Cliente_Envio, Email_Cliente_Envio, Telefono_Cliente_Envio, Direccion_Envio, Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio, Fecha_Pedido)
                     VALUES (?, ?, 'Pagado', 'Wompi', ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [userId, orderDetails.total, transactionReference, 
                     nombreClienteEnvio, emailClienteEnvio, telefonoClienteEnvio, direccionEnvio, 
                     eventData.shipping_address?.region || null, // Asumiendo region como departamento
                     eventData.shipping_address?.city || null,
                     eventData.shipping_address?.address_line_2 || null // Asumiendo address_line_2 como referencia
                    ]
                );
                const pedidoId = pedidoResult.insertId;

                const detallePromises = orderDetails.items.map(item => {
                    return connection.query(
                        'INSERT INTO detalles_pedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario_Compra) VALUES (?, ?, ?, ?)',
                        [pedidoId, item.productId, item.quantity, item.price]
                    );
                });
                await Promise.all(detallePromises);
                console.log(`\t\tPedido ID ${pedidoId} y sus detalles guardados en BD.`);
                await connection.commit();
                console.log(`\t\tCommit DB exitoso. Pedido guardado y Stock actualizado para Ref: ${transactionReference}.`);
                delete wompiTempOrders[transactionReference];
                console.log(`\t\tDatos temporales eliminados para Ref: ${transactionReference}.`);
            }
            res.status(200).json({ success: true, message: `Webhook procesado. Estado Wompi: ${transactionStatus}. Resultado DB: ${updateFailed ? `FALLIDO (Rollback) - ${failureMessage}` : 'OK (Commit)'}` });
        } catch (dbError) {
            console.error(`\t\t!!! Error CRÍTICO DB durante actualización para Ref: ${transactionReference}:`, dbError);
            if (connection) { try { await connection.rollback(); console.log("\t\tRollback DB ejecutado por error crítico."); } catch (rollErr) { console.error("\t\t!!! Error durante Rollback:", rollErr); } }
            res.status(200).json({ success: true, message: "Webhook recibido, error interno crítico en DB." });
        } finally {
            if (connection) { connection.release(); console.log("\t\tConexión DB liberada."); }
        }
    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(transactionStatus)) {
        console.log(`\t[Webhook Wompi] Transacción ${transactionStatus} para Ref: ${transactionReference}. No se actualiza stock.`);
        delete wompiTempOrders[transactionReference];
        console.log(`\t\tDatos temporales eliminados para Ref: ${transactionReference}.`);
        res.status(200).json({ success: true, message: `Webhook procesado. Estado: ${transactionStatus}` });
    } else {
        console.log(`\t[Webhook Wompi] Estado no manejado explícitamente (${transactionStatus}) para Ref: ${transactionReference}. Esperando estado final.`);
        res.status(200).json({ success: true, message: `Webhook recibido. Estado: ${transactionStatus}` });
    }
});


// --- RUTAS DE PEDIDO CONTRA ENTREGA (ACTUALIZADO) ---
app.post('/api/orders/cash-on-delivery', async (req, res) => {
    console.log("--> POST /api/orders/cash-on-delivery");
    const { cart, customerInfo } = req.body;

    // Validación actualizada para incluir departamento y ciudad
    if (!cart || cart.length === 0 || !customerInfo ||
        !customerInfo.name || !customerInfo.phone || !customerInfo.address ||
        !customerInfo.department || !customerInfo.city || 
        !customerInfo.email) {
        return res.status(400).json({ success: false, message: "Faltan datos del carrito o del cliente (incluyendo departamento y ciudad)." });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        console.log("\tIniciando transacción para pedido contra entrega...");

        let totalPedido = 0;
        for (const item of cart) {
            const [productDB] = await connection.query('SELECT Nombre, precio_unitario, cantidad FROM producto WHERE ID_Producto = ? FOR UPDATE', [item.productId]);
            if (productDB.length === 0) throw new Error(`Producto ID ${item.productId} no encontrado.`);
            if (productDB[0].cantidad < item.quantity) {
                throw new Error(`Stock insuficiente para ${productDB[0].Nombre}. Disponible: ${productDB[0].cantidad}, Solicitado: ${item.quantity}. Por favor, ajusta tu carrito.`);
            }
            item.price = productDB[0].precio_unitario; 
            totalPedido += item.price * item.quantity;
        }

        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (
                ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, 
                Nombre_Cliente_Envio, Direccion_Envio, 
                Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio,
                Telefono_Cliente_Envio, Email_Cliente_Envio, Fecha_Pedido
             ) VALUES (?, ?, 'Pendiente de Confirmacion', 'ContraEntrega', ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                customerInfo.userId || null, totalPedido,
                customerInfo.name, customerInfo.address,
                customerInfo.department, customerInfo.city, customerInfo.referencePoint || null, 
                customerInfo.phone, customerInfo.email
            ]
        );
        const pedidoId = pedidoResult.insertId;
        console.log(`\tPedido contra entrega ID ${pedidoId} creado con dirección completa.`);

        for (const item of cart) {
            await connection.query(
                'INSERT INTO detalles_pedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario_Compra) VALUES (?, ?, ?, ?)',
                [pedidoId, item.productId, item.quantity, item.price]
            );
            await connection.query( 
                'UPDATE producto SET cantidad = cantidad - ? WHERE ID_Producto = ?',
                [item.quantity, item.productId]
            );
        }
        console.log("\tDetalles del pedido contra entrega y stock actualizados.");
        await connection.commit();
        console.log("\tCommit: Pedido contra entrega procesado exitosamente.");
        res.status(201).json({ success: true, message: "Pedido contra entrega recibido exitosamente.", orderId: pedidoId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("!!! Error procesando pedido contra entrega:", error);
        res.status(error.message.includes("Stock insuficiente") ? 409 : 500) 
           .json({ success: false, message: error.message || "Error interno al procesar el pedido contra entrega." });
    } finally {
        if (connection) connection.release();
    }
});


// --- RUTAS DE ADMINISTRACIÓN ---
// PRODUCTOS
app.get('/api/admin/products', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/products");
    try {
        const [results] = await dbPool.query('SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 FROM producto ORDER BY ID_Producto ASC');
        console.log(`\t<-- Devolviendo ${results.length} productos para admin`);
        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error GET /api/admin/products:', error);
        res.status(500).json({ success: false, message: 'Error al obtener productos para administración.' });
    }
});

app.get('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`--> GET /api/admin/products/${id}`);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido.' });
    try {
        const [results] = await dbPool.query('SELECT * FROM producto WHERE ID_Producto = ?', [id]);
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        res.status(200).json(results[0]);
    } catch (error) {
        console.error(`!!! Error GET /api/admin/products/${id}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener producto para editar.' });
    }
});

app.post('/api/admin/products', checkAdmin, async (req, res) => {
    console.log("--> POST /api/admin/products");
    try {
        const { Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 } = req.body;
        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (Nombre, Precio, Cantidad, Marca).' });
        }
        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        if (isNaN(precioNum) || precioNum < 0) return res.status(400).json({ success: false, message: 'Precio inválido.' });
        if (isNaN(cantidadNum) || cantidadNum < 0) return res.status(400).json({ success: false, message: 'Cantidad inválida.' });
        if (ID_Categoria && isNaN(categoriaId)) return res.status(400).json({ success: false, message: 'ID Categoría inválido.' });

        const sql = `INSERT INTO producto (Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null, categoriaId, cantidadNum, imagen_url || null, imagen_url_2 || null, imagen_url_3 || null, imagen_url_4 || null, imagen_url_5 || null];
        const [result] = await dbPool.query(sql, values);
        res.status(201).json({ success: true, message: 'Producto añadido exitosamente.', productId: result.insertId });
    } catch (error) {
        console.error('!!! Error POST /api/admin/products:', error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Error: El código de barras ya existe.' });
        res.status(500).json({ success: false, message: 'Error interno al añadir el producto.' });
    }
});

app.put('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`--> PUT /api/admin/products/${id}`);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido.' });
    try {
        const { Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 } = req.body;
        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (Nombre, Precio, Cantidad, Marca).' });
        }
        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        if (isNaN(precioNum) || precioNum < 0) return res.status(400).json({ success: false, message: 'Precio inválido.' });
        if (isNaN(cantidadNum) || cantidadNum < 0) return res.status(400).json({ success: false, message: 'Cantidad inválida.' });
        if (ID_Categoria && isNaN(categoriaId)) return res.status(400).json({ success: false, message: 'ID Categoría inválido.' });


        const sql = `UPDATE producto SET Nombre = ?, Descripcion = ?, precio_unitario = ?, Marca = ?, Codigo_Barras = ?, ID_Categoria = ?, cantidad = ?, imagen_url = ?, imagen_url_2 = ?, imagen_url_3 = ?, imagen_url_4 = ?, imagen_url_5 = ? WHERE ID_Producto = ?`;
        const values = [Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null, categoriaId, cantidadNum, imagen_url || null, imagen_url_2 || null, imagen_url_3 || null, imagen_url_4 || null, imagen_url_5 || null, id];
        const [result] = await dbPool.query(sql, values);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado para actualizar.' });
        res.status(200).json({ success: true, message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        console.error(`!!! Error PUT /api/admin/products/${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Error: El código de barras ya existe para otro producto.' });
        res.status(500).json({ success: false, message: 'Error interno al actualizar el producto.' });
    }
});

app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`--> DELETE /api/admin/products/${id}`);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido.' });
    try {
        const [result] = await dbPool.query('DELETE FROM producto WHERE ID_Producto = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado para eliminar.' });
        res.status(200).json({ success: true, message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error(`!!! Error DELETE /api/admin/products/${id}:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ success: false, message: 'Error: No se puede eliminar el producto porque está referenciado (ej. en pedidos).' });
        res.status(500).json({ success: false, message: 'Error interno al eliminar el producto.' });
    }
});


app.get('/api/admin/users', checkAdmin, async (req, res) => {
    try {
        const [users] = await dbPool.query('SELECT id, username, email, role FROM usuarios ORDER BY id DESC');
        res.status(200).json(users);
    } catch (error) {
        console.error("!!! Error GET /api/admin/users:", error); 
        res.status(500).json({ success: false, message: "Error al obtener usuarios." });
    }
});


// SETTINGS
app.get('/api/admin/settings', checkAdmin, (req, res) => {
    console.log("--> GET /api/admin/settings");
    res.status(200).json({ success: true, settings: siteSettings });
});

app.put('/api/admin/settings', checkAdmin, async (req, res) => {
    console.log("--> PUT /api/admin/settings");
    const newSettings = req.body;
    const allowedKeys = [
        'colorPrimary', 'colorSecondary', 'colorAccent',
        'welcomeTitle', 'promoBannerTitle', 'promoBannerText',
        'contactAddress', 'contactPhone', 'contactEmail',
        'socialFacebook', 'socialTwitter', 'socialInstagram', 'socialYoutube'
    ];
    let dbOperations = [];
    let changesMade = false;

    console.log("\tDatos recibidos para actualizar settings:", newSettings);

    for (const key in newSettings) {
        if (allowedKeys.includes(key) && newSettings[key] !== undefined) {
            if (key.startsWith('color') && typeof newSettings[key] === 'string' && !/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(newSettings[key])) {
                console.warn(`\tIgnorando setting '${key}' por formato de color inválido: ${newSettings[key]}`);
                continue;
            }
            if (key.startsWith('social') && typeof newSettings[key] === 'string' && newSettings[key] && !newSettings[key].startsWith('http')) {
                 console.warn(`\tIgnorando setting '${key}' por formato de URL inválido (debe empezar con http/https): ${newSettings[key]}`);
                 continue;
            }

            const valueToStore = typeof newSettings[key] === 'string' ? newSettings[key].trim() : newSettings[key];
            const finalValue = (valueToStore === null || valueToStore === undefined) ? '' : valueToStore;

            if (siteSettings[key] !== finalValue) { 
                siteSettings[key] = finalValue; 
                changesMade = true;
                dbOperations.push(
                    dbPool.query(
                        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                        [key, siteSettings[key], siteSettings[key]]
                    )
                );
                console.log(`\tSetting '${key}' preparado para actualizar en BD a: '${siteSettings[key]}'`);
            }
        } else {
            console.warn(`\tIgnorando setting no permitido o indefinido: '${key}'`);
        }
    }

    if (dbOperations.length > 0) {
        try {
            await Promise.all(dbOperations);
            console.log("\t<-- Configuración del sitio actualizada en la base de datos.");
            res.status(200).json({ success: true, message: 'Configuración actualizada.', settings: siteSettings });
        } catch (error) {
            console.error("!!! Error al guardar settings en la DB:", error);
            res.status(500).json({ success: false, message: 'Error al guardar la configuración en la base de datos.'});
        }
    } else if (changesMade) { 
        console.log("\t<-- No se realizaron cambios que requirieran actualización de base de datos, pero settings en memoria actualizados.");
        res.status(200).json({ success: true, message: 'Configuración actualizada (sin cambios en BD).', settings: siteSettings });
    }
    else {
        console.log("\t<-- No se realizaron cambios válidos en la configuración.");
        res.status(200).json({ success: true, message: 'No se proporcionaron datos válidos para actualizar.', settings: siteSettings });
    }
});


// PEDIDOS
app.get('/api/admin/orders', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/orders");
    try {
        const [pedidos] = await dbPool.query(
            `SELECT p.ID_Pedido, p.Fecha_Pedido, p.Total_Pedido, p.Estado_Pedido, p.Metodo_Pago, p.Referencia_Pago,
                    COALESCE(u.username, p.Nombre_Cliente_Envio) as Cliente_Nombre,
                    COALESCE(u.email, p.Email_Cliente_Envio) as Cliente_Email
             FROM pedidos p
             LEFT JOIN usuarios u ON p.ID_Usuario = u.id
             ORDER BY p.Fecha_Pedido DESC`
        );
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("!!! Error GET /api/admin/orders:", error);
        res.status(500).json({ success: false, message: "Error al obtener los pedidos." });
    }
});

app.get('/api/admin/orders/:id', checkAdmin, async (req, res) => {
    const { id: pedidoId } = req.params;
    console.log(`--> GET /api/admin/orders/${pedidoId}`);
    if (isNaN(pedidoId)) return res.status(400).json({ success: false, message: "ID de pedido inválido." });
    try {
        const [pedidoInfo] = await dbPool.query( // Query is already p.*
            `SELECT p.*, COALESCE(u.username, p.Nombre_Cliente_Envio) as Cliente_Nombre, COALESCE(u.email, p.Email_Cliente_Envio) as Cliente_Email
             FROM pedidos p
             LEFT JOIN usuarios u ON p.ID_Usuario = u.id
             WHERE p.ID_Pedido = ?`, [pedidoId]
        );
        if (pedidoInfo.length === 0) return res.status(404).json({ success: false, message: "Pedido no encontrado." });
        const [detalles] = await dbPool.query(
            `SELECT dp.*, prod.Nombre as Nombre_Producto, prod.imagen_url as Imagen_Producto
             FROM detalles_pedido dp
             JOIN producto prod ON dp.ID_Producto = prod.ID_Producto
             WHERE dp.ID_Pedido = ?`, [pedidoId]
        );
        res.status(200).json({ ...pedidoInfo[0], detalles });
    } catch (error) {
        console.error(`!!! Error GET /api/admin/orders/${pedidoId}:`, error);
        res.status(500).json({ success: false, message: "Error al obtener el detalle del pedido." });
    }
});

app.put('/api/admin/orders/:id/status', checkAdmin, async (req, res) => {
    const { id: pedidoId } = req.params;
    const { nuevoEstado } = req.body;
    console.log(`--> PUT /api/admin/orders/${pedidoId}/status - Nuevo estado: ${nuevoEstado}`);
    const estadosValidos = ['Pendiente de Pago','Pagado','Procesando','Enviado','Entregado','Cancelado','Pendiente de Confirmacion'];
    if (!estadosValidos.includes(nuevoEstado)) {
        return res.status(400).json({ success: false, message: "Estado de pedido inválido." });
    }
    try {
        const [result] = await dbPool.query('UPDATE pedidos SET Estado_Pedido = ? WHERE ID_Pedido = ?', [nuevoEstado, pedidoId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Pedido no encontrado." });
        res.status(200).json({ success: true, message: "Estado del pedido actualizado." });
    } catch (error) {
        console.error(`!!! Error PUT /api/admin/orders/${pedidoId}/status:`, error);
        res.status(500).json({ success: false, message: "Error al actualizar el estado del pedido." });
    }
});

// ANALÍTICAS
app.get('/api/admin/analytics/sales-overview', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/analytics/sales-overview");
    try {
        const [dailySales] = await dbPool.query(
            `SELECT DATE_FORMAT(Fecha_Pedido, '%Y-%m-%d') as dia, SUM(Total_Pedido) as total_ventas
             FROM pedidos
             WHERE Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado') AND Fecha_Pedido >= CURDATE() - INTERVAL 30 DAY
             GROUP BY DATE_FORMAT(Fecha_Pedido, '%Y-%m-%d')
             ORDER BY dia ASC`
        );
        const [topProducts] = await dbPool.query(
            `SELECT p.Nombre, SUM(dp.Cantidad) as total_vendido
             FROM detalles_pedido dp
             JOIN producto p ON dp.ID_Producto = p.ID_Producto
             JOIN pedidos ped ON dp.ID_Pedido = ped.ID_Pedido
             WHERE ped.Estado_Pedido IN ('Pagado', 'Entregado', 'Enviado')
             GROUP BY dp.ID_Producto, p.Nombre
             ORDER BY total_vendido DESC LIMIT 10`
        );
        res.status(200).json({ dailySales, topProducts });
    } catch (error) {
        console.error("!!! Error GET /api/admin/analytics/sales-overview:", error);
        res.status(500).json({ success: false, message: "Error al obtener datos de analíticas de ventas." });
    }
});

app.get('/api/admin/analytics/product-views', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/analytics/product-views");
    try {
        const [productViews] = await dbPool.query(
            `SELECT p.Nombre, COUNT(vp.ID_Vista) as total_vistas
             FROM vistas_producto vp
             JOIN producto p ON vp.ID_Producto = p.ID_Producto
             GROUP BY vp.ID_Producto, p.Nombre
             ORDER BY total_vistas DESC LIMIT 20` 
        );
        res.status(200).json(productViews);
    } catch (error) {
        console.error("!!! Error GET /api/admin/analytics/product-views:", error);
        res.status(500).json({ success: false, message: "Error al obtener datos de vistas de productos." });
    }
});


// MENSAJES DE CONTACTO
app.get('/api/admin/contact-messages', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/contact-messages");
    try {
        const [messages] = await dbPool.query(
            'SELECT id, name, email, subject, LEFT(message, 100) as message_preview, created_at FROM contact_messages ORDER BY created_at DESC'
        );
        res.status(200).json(messages);
    } catch (error) {
        console.error("!!! Error GET /api/admin/contact-messages:", error);
        res.status(500).json({ success: false, message: "Error al obtener los mensajes de contacto." });
    }
});


// --- INICIAR SERVIDOR ---
initializeApp().then(() => {
    app.listen(PORT, () => {
        console.log("\n========================================");
        console.log(`==> Servidor Ferremax escuchando en puerto ${PORT}`);
        console.log(`==> Modo: ${isProduction ? 'Producción' : 'Desarrollo/Sandbox'}`);
        console.log("========================================");
    });
}).catch(err => {
    console.error("Fallo al inicializar la aplicación:", err);
    process.exit(1);
});


// --- MANEJO DE CIERRE GRACEFUL ---
const gracefulShutdown = async (signal) => {
    console.log(`\n==> Recibida señal ${signal}. Cerrando servidor graceful...`);
    try {
        if (dbPool) {
            console.log('--> Cerrando pool de conexiones a la base de datos...');
            await dbPool.end();
            console.log('--> Pool de conexiones DB cerrado.');
        }
    } catch (err) {
        console.error('!!! Error durante el cierre del pool de DB:', err);
    } finally {
        console.log("==> Servidor cerrado.");
        process.exit(0);
    }
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);