// server.js - Servidor Backend Unificado para Ferremax con Wompi, Admin CRUD y Personalización
// Versión que lee la configuración de la DB desde variables de entorno estándar (.env localmente)
// Añadido SSL para conexión a TiDB Cloud
// *** Añadido soporte para 5 imágenes de producto ***

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

// --- ALMACENAMIENTO SIMULADO DE CONFIGURACIÓN DEL SITIO ---
// *** CAMBIO: Añadir campos para contacto y redes sociales a la configuración inicial/default ***
let siteSettings = {
    colorPrimary: '#ea580c',
    colorSecondary: '#047857',
    colorAccent: '#f1f5f9',
    welcomeTitle: 'Bienvenido a Ferremax',
    promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
    promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!',
    // Nuevos campos (inicialmente vacíos o con valores por defecto)
    contactAddress: 'Calle Falsa 123, Barranquilla, Colombia',
    contactPhone: '+57 300 123 4567',
    contactEmail: 'info@ferremax.example.com',
    socialFacebook: 'https://www.facebook.com/share/19ra2fvR3q/?mibextid=wwXIfr',
    socialTwitter: '',
    socialInstagram: '',
    socialYoutube: 'https://youtu.be/iQLCN3J3dt4?si=wiMZB-02ewAsQaFe'
};
console.log("--> Configuración inicial del sitio (simulada):", siteSettings);

// --- ALMACENAMIENTO TEMPORAL PARA ÓRDENES WOMPI ---
const wompiTempOrders = {};
const WOMPI_TEMP_ORDER_TIMEOUT = 1000 * 60 * 30;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONEXIÓN BASE DE DATOS (Con SSL para TiDB Cloud) ---
let dbPool;
try {
    console.log("Intentando conectar a la DB usando variables de entorno estándar (DB_HOST, DB_USER, etc.)...");
    dbPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306, // TiDB Cloud usa 4000, pero Render puede inyectar DB_PORT
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: {
             rejectUnauthorized: true // Requerido por TiDB Cloud Serverless
        }
    });

    dbPool.getConnection()
        .then(connection => {
            console.log(`--> Conexión exitosa a la base de datos '${connection.config.database}' en ${connection.config.host}:${connection.config.port}`);
            connection.release();
        })
        .catch(err => {
            console.error(`!!! Error de conexión inicial a la base de datos (${err.code || 'N/A'}): ${err.message}`);
            if (err.message.includes('SSL')) {
                console.error("--> Detalle SSL:", err);
            }
        });

} catch (error) {
    console.error("!!! Error CRÍTICO al crear el pool de conexiones a la DB:", error);
    if (isProduction) process.exit(1);
}

// --- MIDDLEWARE DE AUTENTICACIÓN ADMIN ---
const checkAdmin = (req, res, next) => {
    const isAdminSimulated = req.headers['x-admin-simulated'] === 'true';
    if (isAdminSimulated) {
        console.log(`\t[Admin Check] Acceso Permitido (Simulado) para: ${req.method} ${req.path}`);
        next();
    } else {
        console.warn(`\t[Admin Check] Acceso DENEGADO a ruta admin ${req.method} ${req.path}. Falta/incorrecta cabecera x-admin-simulated.`);
        res.status(403).json({ success: false, message: 'Acceso prohibido. Se requieren permisos de administrador.' });
    }
};

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
    try {
        // *** CAMBIO: Seleccionar también las nuevas columnas de imagen ***
        const [results] = await dbPool.query(
            'SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 FROM producto'
        );
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
        // *** CAMBIO: Seleccionar también las nuevas columnas de imagen ***
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
    console.log("--> POST /api/contact (Simulado)");
    try {
        const { name, email, subject, message } = req.body;
        console.log(`\tMensaje contacto RECIBIDO (Simulado): De ${name} <${email}> Asunto: ${subject}`);
        console.log(`\tMensaje: ${message}`);
        res.status(200).json({ success: true, message: 'Mensaje recibido correctamente (simulación).' });
    } catch (error) {
        console.error("!!! Error simulando recepción de contacto:", error);
        res.status(500).json({ success: false, message: "Error interno al procesar el mensaje." });
    }
});

// --- RUTAS WOMPI ---
app.post('/api/wompi/temp-order', async (req, res) => { /* ... (sin cambios) ... */
    const { reference, items, total } = req.body;
    console.log(`--> POST /api/wompi/temp-order (Ref: ${reference})`);
    if (!reference || !Array.isArray(items) || items.length === 0 || total === undefined) {
        console.warn("\tSolicitud rechazada: Datos inválidos para orden temporal.");
        return res.status(400).json({ success: false, message: 'Datos inválidos para orden temporal.' });
    }
    const hasInvalidItem = items.some(item => !item.productId || !item.quantity || item.quantity <= 0 || item.price === undefined );
    if (hasInvalidItem) {
         console.warn("\tSolicitud rechazada: Items inválidos en orden temporal.");
         return res.status(400).json({ success: false, message: 'Items inválidos en orden temporal.' });
    }
    wompiTempOrders[reference] = { items: items, total: total, timestamp: Date.now() };
    console.log(`\t<-- Orden temporal guardada para Ref: ${reference}`);
    setTimeout(() => { if (wompiTempOrders[reference]) { console.log(`\t[Cleanup] Eliminando orden temporal expirada: ${reference}`); delete wompiTempOrders[reference]; } }, WOMPI_TEMP_ORDER_TIMEOUT);
    res.status(200).json({ success: true, message: 'Orden temporal guardada.' });
});
app.post('/api/wompi/webhook', async (req, res) => { /* ... (sin cambios) ... */
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
    const orderItems = orderDetails.items;
    if (transactionStatus === 'APPROVED') {
        console.log(`\t[Webhook Wompi] Transacción APROBADA para Ref: ${transactionReference}. Intentando actualizar stock...`);
        let connection;
        try {
            connection = await dbPool.getConnection();
            await connection.beginTransaction();
            console.log("\t\tIniciando transacción DB para actualizar stock...");
            const updatePromises = orderItems.map(item => {
                console.log(`\t\t- Descontando ${item.quantity} de stock para Producto ID: ${item.productId}`);
                return connection.query( 'UPDATE producto SET cantidad = GREATEST(0, cantidad - ?) WHERE ID_Producto = ? AND cantidad >= ?', [item.quantity, item.productId, item.quantity] );
            });
            const updateResults = await Promise.all(updatePromises);
            let updateFailed = false;
            let failureMessage = '';
            for (let i = 0; i < updateResults.length; i++) {
                const result = updateResults[i][0];
                if (result.affectedRows === 0) {
                    const [checkProduct] = await connection.query('SELECT Nombre, cantidad FROM producto WHERE ID_Producto = ?', [orderItems[i].productId]);
                    const productName = checkProduct.length > 0 ? checkProduct[0].Nombre : `ID ${orderItems[i].productId}`;
                    const currentStock = checkProduct.length > 0 ? checkProduct[0].cantidad : 'N/A';
                    failureMessage = `No se pudo actualizar stock para "${productName}". Stock actual: ${currentStock}, Se intentó restar: ${orderItems[i].quantity}.`;
                    console.error(`\t\t!!! Error DB: ${failureMessage}`);
                    updateFailed = true;
                    break;
                }
            }
            if (updateFailed) {
                await connection.rollback();
                console.error(`\t\t!!! Rollback DB ejecutado para Ref: ${transactionReference} debido a: ${failureMessage}`);
            } else {
                await connection.commit();
                console.log(`\t\tCommit DB exitoso. Stock actualizado para Ref: ${transactionReference}.`);
                delete wompiTempOrders[transactionReference];
                console.log(`\t\tDatos temporales eliminados para Ref: ${transactionReference}.`);
            }
            res.status(200).json({ success: true, message: `Webhook procesado. Estado Wompi: ${transactionStatus}. Resultado DB: ${updateFailed ? 'FALLIDO (Rollback)' : 'OK (Commit)'}` });
        } catch (dbError) {
            console.error(`\t\t!!! Error CRÍTICO DB durante actualización de stock para Ref: ${transactionReference}:`, dbError);
            if (connection) { try { await connection.rollback(); console.log("\t\tRollback DB ejecutado por error crítico."); } catch (rollErr) { console.error("\t\t!!! Error durante Rollback:", rollErr); } }
             res.status(200).json({ success: true, message: "Webhook recibido, error interno crítico en DB." });
        } finally { if (connection) { connection.release(); console.log("\t\tConexión DB liberada."); } }
    } else if (transactionStatus === 'DECLINED' || transactionStatus === 'VOIDED' || transactionStatus === 'ERROR') {
        console.log(`\t[Webhook Wompi] Transacción ${transactionStatus} para Ref: ${transactionReference}. No se actualiza stock.`);
        delete wompiTempOrders[transactionReference];
        console.log(`\t\tDatos temporales eliminados para Ref: ${transactionReference}.`);
        res.status(200).json({ success: true, message: `Webhook procesado. Estado: ${transactionStatus}` });
    } else {
         console.log(`\t[Webhook Wompi] Estado no manejado (${transactionStatus}) para Ref: ${transactionReference}. Esperando estado final.`);
         res.status(200).json({ success: true, message: `Webhook recibido. Estado: ${transactionStatus}` });
    }
});

// --- RUTAS DE ADMINISTRACIÓN ---
app.get('/api/admin/products', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/products");
    try {
        // *** CAMBIO: Seleccionar también las nuevas columnas de imagen ***
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
    if (isNaN(id)) {
        console.warn("\tSolicitud rechazada: ID inválido.");
        return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    try {
        // *** CAMBIO: Seleccionar también las nuevas columnas de imagen ***
        // Usar SELECT * es más simple aquí ya que necesitamos todas las columnas para editar
        const [results] = await dbPool.query('SELECT * FROM producto WHERE ID_Producto = ?', [id]);
        if (results.length === 0) {
             console.log(`\t<-- Producto admin ID ${id} no encontrado para editar`);
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        console.log(`\t<-- Devolviendo producto admin ID ${id} para editar`);
        res.status(200).json(results[0]);
    } catch (error) {
        console.error(`!!! Error GET /api/admin/products/${id}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener producto para editar.' });
    }
});

app.post('/api/admin/products', checkAdmin, async (req, res) => {
    console.log("--> POST /api/admin/products");
    try {
        // *** CAMBIO: Recibir las nuevas URLs de imagen del body ***
        const { Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 } = req.body;
        console.log("\tDatos recibidos para añadir:", req.body);

        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) {
            console.warn("\tValidación fallida: Faltan datos requeridos (*).");
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (Nombre, Precio, Cantidad, Marca).' });
        }

        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        if (isNaN(precioNum) || precioNum < 0) { console.warn("\tValidación fallida: Precio inválido."); return res.status(400).json({ success: false, message: 'Precio inválido.' }); }
        if (isNaN(cantidadNum) || cantidadNum < 0) { console.warn("\tValidación fallida: Cantidad inválida."); return res.status(400).json({ success: false, message: 'Cantidad inválida.' }); }
        if (ID_Categoria && isNaN(categoriaId)) { console.warn("\tValidación fallida: ID Categoría inválido."); return res.status(400).json({ success: false, message: 'ID Categoría inválido.' }); }

        // *** CAMBIO: Añadir las nuevas columnas al INSERT SQL ***
        const sql = `INSERT INTO producto
                     (Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null,
            categoriaId, cantidadNum, imagen_url || null,
            imagen_url_2 || null, // Añadir nuevas URLs (o null si están vacías)
            imagen_url_3 || null,
            imagen_url_4 || null,
            imagen_url_5 || null
        ];

        console.log("\tEjecutando SQL INSERT...");
        const [result] = await dbPool.query(sql, values);

        console.log(`\t<-- Producto añadido con ID: ${result.insertId}`);
        res.status(201).json({ success: true, message: 'Producto añadido exitosamente.', productId: result.insertId });

    } catch (error) {
        console.error('!!! Error POST /api/admin/products:', error);
        if (error.code === 'ER_DUP_ENTRY') { console.warn("\tError: Intento de insertar código de barras duplicado."); return res.status(409).json({ success: false, message: 'Error: El código de barras ya existe.' }); }
        res.status(500).json({ success: false, message: 'Error interno del servidor al añadir el producto.' });
    }
});

app.put('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`--> PUT /api/admin/products/${id}`);
    if (isNaN(id)) { console.warn("\tSolicitud rechazada: ID inválido."); return res.status(400).json({ success: false, message: 'ID inválido.' }); }

    try {
        // *** CAMBIO: Recibir las nuevas URLs de imagen del body ***
        const { Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url, imagen_url_2, imagen_url_3, imagen_url_4, imagen_url_5 } = req.body;
        console.log(`\tDatos recibidos para actualizar ID ${id}:`, req.body);

        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) { console.warn("\tValidación fallida: Faltan datos requeridos (*)."); return res.status(400).json({ success: false, message: 'Faltan datos requeridos (Nombre, Precio, Cantidad, Marca).' }); }

        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        if (isNaN(precioNum) || precioNum < 0) { console.warn("\tValidación fallida: Precio inválido."); return res.status(400).json({ success: false, message: 'Precio inválido.' }); }
        if (isNaN(cantidadNum) || cantidadNum < 0) { console.warn("\tValidación fallida: Cantidad inválida."); return res.status(400).json({ success: false, message: 'Cantidad inválida.' }); }
        if (ID_Categoria && isNaN(categoriaId)) { console.warn("\tValidación fallida: ID Categoría inválido."); return res.status(400).json({ success: false, message: 'ID Categoría inválido.' }); }

        // *** CAMBIO: Añadir las nuevas columnas al UPDATE SQL ***
        const sql = `UPDATE producto SET
                        Nombre = ?, Descripcion = ?, precio_unitario = ?, Marca = ?,
                        Codigo_Barras = ?, ID_Categoria = ?, cantidad = ?, imagen_url = ?,
                        imagen_url_2 = ?, imagen_url_3 = ?, imagen_url_4 = ?, imagen_url_5 = ?
                     WHERE ID_Producto = ?`;
        const values = [
            Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null,
            categoriaId, cantidadNum, imagen_url || null,
            imagen_url_2 || null, // Añadir nuevas URLs (o null si están vacías)
            imagen_url_3 || null,
            imagen_url_4 || null,
            imagen_url_5 || null,
            id // El ID va al final para el WHERE
        ];

        console.log("\tEjecutando SQL UPDATE...");
        const [result] = await dbPool.query(sql, values);

        if (result.affectedRows === 0) { console.log(`\t<-- Producto ID ${id} no encontrado para actualizar`); return res.status(404).json({ success: false, message: 'Producto no encontrado para actualizar.' }); }

        console.log(`\t<-- Producto actualizado ID: ${id}`);
        res.status(200).json({ success: true, message: 'Producto actualizado exitosamente.' });

    } catch (error) {
        console.error(`!!! Error PUT /api/admin/products/${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') { console.warn("\tError: Intento de actualizar a un código de barras duplicado."); return res.status(409).json({ success: false, message: 'Error: El código de barras ya existe para otro producto.' }); }
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el producto.' });
    }
});

app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`--> DELETE /api/admin/products/${id}`);
     if (isNaN(id)) { console.warn("\tSolicitud rechazada: ID inválido."); return res.status(400).json({ success: false, message: 'ID inválido.' }); }
    try {
        const sql = 'DELETE FROM producto WHERE ID_Producto = ?';
        console.log("\tEjecutando SQL DELETE...");
        const [result] = await dbPool.query(sql, [id]);
        if (result.affectedRows === 0) { console.log(`\t<-- Producto ID ${id} no encontrado para eliminar`); return res.status(404).json({ success: false, message: 'Producto no encontrado para eliminar.' }); }
        console.log(`\t<-- Producto eliminado ID: ${id}`);
        res.status(200).json({ success: true, message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error(`!!! Error DELETE /api/admin/products/${id}:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') { console.warn(`\tError: Producto ID ${id} está referenciado en otra tabla.`); return res.status(409).json({ success: false, message: 'Error: No se puede eliminar el producto porque está referenciado (ej. en ventas).' }); }
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar el producto.' });
    }
});

// *** CAMBIO: GET /api/admin/settings ahora devuelve todos los settings ***
app.get('/api/admin/settings', checkAdmin, (req, res) => {
    console.log("--> GET /api/admin/settings");
    // En un caso real, leerías esto de una tabla 'settings' en la DB
    console.log("\t<-- Devolviendo configuración del sitio (simulada)");
    res.status(200).json({ success: true, settings: siteSettings });
});

// *** CAMBIO: PUT /api/admin/settings ahora maneja todas las claves ***
app.put('/api/admin/settings', checkAdmin, (req, res) => {
    console.log("--> PUT /api/admin/settings");
    const newSettings = req.body;
    // Definir todas las claves permitidas
    const allowedKeys = [
        'colorPrimary', 'colorSecondary', 'colorAccent',
        'welcomeTitle', 'promoBannerTitle', 'promoBannerText',
        'contactAddress', 'contactPhone', 'contactEmail',
        'socialFacebook', 'socialTwitter', 'socialInstagram', 'socialYoutube'
    ];
    let updated = false;

    console.log("\tDatos recibidos para actualizar settings:", newSettings);

    for (const key in newSettings) {
        // Permitir actualizar solo las claves definidas y si el valor no es undefined
        if (allowedKeys.includes(key) && newSettings[key] !== undefined) {
            // Validar formato de color si es una clave de color
            if (key.startsWith('color') && typeof newSettings[key] === 'string' && !/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(newSettings[key])) {
                console.warn(`\tIgnorando setting '${key}' por formato de color inválido: ${newSettings[key]}`);
                continue; // Saltar esta clave inválida
            }
            // Validar URLs si son claves sociales (simple check por http/https)
            if (key.startsWith('social') && typeof newSettings[key] === 'string' && newSettings[key] && !newSettings[key].startsWith('http')) {
                 console.warn(`\tIgnorando setting '${key}' por formato de URL inválido (debe empezar con http/https): ${newSettings[key]}`);
                 continue;
            }

            // Actualizar valor (quitando espacios extra si es string)
            siteSettings[key] = typeof newSettings[key] === 'string' ? newSettings[key].trim() : newSettings[key];
            // Guardar string vacío si el valor recibido es null o vacío (para poder borrar URLs)
            if (siteSettings[key] === null || siteSettings[key] === undefined) {
                siteSettings[key] = '';
            }

            updated = true;
            console.log(`\tSetting '${key}' actualizado a: '${siteSettings[key]}'`);
        } else {
            console.warn(`\tIgnorando setting no permitido o indefinido: '${key}'`);
        }
    }

    // En un caso real, aquí guardarías el objeto 'siteSettings' completo en la DB

    if (updated) {
        console.log("\t<-- Configuración del sitio actualizada (simulada).");
        // Devolver el objeto completo de settings actualizado
        res.status(200).json({ success: true, message: 'Configuración actualizada.', settings: siteSettings });
    } else {
        console.log("\t<-- No se realizaron cambios válidos en la configuración.");
        res.status(200).json({ success: true, message: 'No se proporcionaron datos válidos para actualizar.', settings: siteSettings });
    }
});


// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log("\n========================================");
    console.log(`==> Servidor Ferremax (Wompi) escuchando en puerto ${PORT}`);
    console.log(`==> Modo: ${isProduction ? 'Producción' : 'Desarrollo/Sandbox'}`);
    console.log("========================================");
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

