// server.js - Servidor Backend Unificado para Ferremax con Wompi, Admin CRUD, Personalización y Asistente IA (Gemini)
// Versión que lee la configuración de la DB desde variables de entorno estándar (.env localmente)
// Añadido SSL para conexión a TiDB Cloud
// *** Integrado Asistente IA con Gemini de Google y logueo detallado para depuración RAG ***
// *** Mejorado prompt de IA para conciencia de página y conocimiento de políticas ***

// --- DEPENDENCIAS ---
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const nodemailer = require('nodemailer');

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

// --- CONFIGURACIÓN GOOGLE GEMINI ---
let genAI;
let geminiModel;

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

// --- CONFIGURACIÓN DEL SITIO DESDE BASE DE DATOS ---
let siteSettings = {};

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
        console.log("--> Configuración del sitio cargada desde BD (o defaults aplicados):", Object.keys(siteSettings).length > 0 ? `OK (${Object.keys(siteSettings).length} settings)` : "VACÍA/FALLÓ");

    } catch (error) {
        console.error("!!! Error CRÍTICO al cargar siteSettings desde la DB. Usando defaults en memoria:", error);
        siteSettings = {
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
const WOMPI_TEMP_ORDER_TIMEOUT = 1000 * 60 * 30;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONEXIÓN BASE DE DATOS ---
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

// --- MIDDLEWARE DE AUTENTICACIÓN DE USUARIO REGISTRADO ---
const checkUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId || isNaN(parseInt(userId))) {
        console.warn(`\t[User Check] Acceso DENEGADO: Falta o es inválido x-user-id.`);
        return res.status(401).json({ success: false, message: 'Autenticación requerida.' });
    }
    try {
        if (!dbPool) throw new Error("dbPool no inicializado en checkUser");
        const [users] = await dbPool.query('SELECT id FROM usuarios WHERE id = ?', [userId]);
        if (users.length === 0) {
            console.warn(`\t[User Check] Usuario con ID ${userId} no encontrado.`);
            return res.status(401).json({ success: false, message: 'Usuario no válido.' });
        }
        req.userId = parseInt(userId);
        next();
    } catch (error) {
        console.error('!!! Error en middleware checkUser:', error);
        return res.status(500).json({ success: false, message: 'Error de autenticación.' });
    }
};

// --- FUNCIÓN HELPER MEJORADA ---
async function getOrCreateClienteId(connection, { username, email }) {
    if (!email) {
        throw new Error("El email es requerido para crear o encontrar un cliente.");
    }
    // Usar la conexión de la transacción para todas las consultas
    const [clientes] = await connection.query('SELECT ID_Cliente FROM cliente WHERE Email = ? LIMIT 1', [email]);
    if (clientes.length > 0) {
        console.log(`\t\tCliente encontrado con email ${email}, ID: ${clientes[0].ID_Cliente}`);
        return clientes[0].ID_Cliente;
    }
    // Si no existe, crear uno nuevo
    console.log(`\t\tCliente no encontrado, creando nuevo cliente para email ${email}...`);
    const [result] = await connection.query(
        'INSERT INTO cliente (Nombre, Apellido, Email) VALUES (?, ?, ?)',

        [username || email.split('@')[0], '', email]
    );
    console.log(`\t\tNuevo cliente creado con ID: ${result.insertId}`);
    return result.insertId;
}

// --- RUTAS ---
// ... (Rutas de /api/config, auth, productos públicos, categorías, contacto, historial de usuario, wompi, pago contra entrega, y admin se mantienen igual que en la versión anterior) ...
// --- RUTA PARA CONFIGURACIÓN DEL FRONTEND ---
app.get('/api/config', (req, res) => {
    console.log("--> GET /api/config");
    try {
        res.status(200).json({
            success: true,
            wompiPublicKey: process.env.WOMPI_PUBLIC_KEY,
            webhookUrl: `${process.env.BACKEND_URL}/api/wompi/webhook` // <<< AÑADIDO >>>
        });
        console.log("\t<-- Enviando configuración pública (Wompi Key y Webhook URL) al frontend.");
    } catch (error) {
        console.error("!!! Error en /api/config:", error);
        res.status(500).json({ success: false, message: 'Error al obtener la configuración.' });
    }
});

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/register', async (req, res) => {
    console.log("--> POST /register");
    try {
        if (!dbPool) throw new Error("dbPool no inicializado en /register");
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
        const [existingCliente] = await dbPool.query('SELECT ID_Cliente FROM cliente WHERE Email = ? LIMIT 1', [email]);
        if (existingCliente.length === 0) {
            await dbPool.query(
                'INSERT INTO cliente (Nombre, Apellido, Email) VALUES (?, ?, ?)',
                [username || '', '', email]
            );
            console.log(`\t<-- Cliente creado para usuario: ${username} (${email})`);
        }
        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('!!! Error en /register:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor durante el registro.' });
    }
});

app.post('/login', async (req, res) => {
    console.log("--> POST /login");
    try {
        if (!dbPool) throw new Error("dbPool no inicializado en /login");
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
        if (!dbPool) throw new Error("dbPool no inicializado en /api/productos");
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
        if (!dbPool) throw new Error("dbPool no inicializado en /api/productos/:id");
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

// --- RUTA PARA OBTENER RESEÑAS DE UN PRODUCTO ---
app.get('/api/products/:id/reviews', async (req, res) => {
    const { id: productId } = req.params;
    console.log(`--> GET /api/products/${productId}/reviews`);
    try {
        const [reviews] = await dbPool.query(
            'SELECT * FROM reseñas WHERE ID_Producto = ? ORDER BY Fecha_Reseña DESC',
            [productId]
        );
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error(`!!! Error al obtener reseñas para el producto ${productId}:`, error);
        res.status(500).json({ success: false, message: 'Error al cargar las reseñas.' });
    }
});

// --- RUTA PARA ENVIAR UNA NUEVA RESEÑA ---
app.post('/api/products/:id/reviews', async (req, res) => {
    const { id: productId } = req.params;
    const { userId, name, rating, comment } = req.body;
    console.log(`--> POST /api/products/${productId}/reviews`);

    if (!name || !rating || !comment) {
        return res.status(400).json({ success: false, message: 'Nombre, calificación y comentario son requeridos.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'La calificación debe ser entre 1 y 5.' });
    }

    try {
        await dbPool.query(
            'INSERT INTO reseñas (ID_Producto, ID_Usuario, Nombre_Usuario, Calificacion, Comentario, Fecha_Reseña) VALUES (?, ?, ?, ?, ?, NOW())',
            [productId, userId || null, name, rating, comment]
        );
        res.status(201).json({ success: true, message: '¡Gracias por tu reseña!' });
    } catch (error) {
        console.error(`!!! Error al guardar la reseña para el producto ${productId}:`, error);
        res.status(500).json({ success: false, message: 'No se pudo guardar tu reseña en este momento.' });
    }
});

app.get('/api/categories', async (req, res) => {
    console.log("--> GET /api/categories");
    try {
        if (!dbPool) throw new Error("dbPool no inicializado en /api/categories");
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
        if (!dbPool) throw new Error("dbPool no inicializado en /api/contact");
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            console.warn("\tMensaje de contacto: Faltan datos requeridos (nombre, email, mensaje).");
            return res.status(400).json({ success: false, message: "Nombre, email y mensaje son requeridos." });
        }
        await dbPool.query(
            'INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, subject || null, message]
        );
        console.log(`\t<-- Mensaje de contacto de ${name} <${email}> (Asunto: ${subject || 'N/A'}) guardado en BD.`);
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
        if (!dbPool) throw new Error("dbPool no inicializado en /api/products/:id/view");
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

// --- RUTA PARA HISTORIAL DE COMPRAS DEL USUARIO ---
app.get('/api/user/orders', checkUser, async (req, res) => {
    const userId = req.userId;
    console.log(`--> GET /api/user/orders for User ID: ${userId}`);
    try {
        if (!dbPool) throw new Error("dbPool no inicializado en /api/user/orders");
        const [pedidos] = await dbPool.query(
            `SELECT
                p.ID_Pedido, p.Fecha_Pedido, p.Total_Pedido, p.Estado_Pedido, p.Metodo_Pago, p.Referencia_Pago
             FROM pedidos p
             WHERE p.ID_Usuario = ?
             ORDER BY p.Fecha_Pedido DESC`,
            [userId]
        );

        if (pedidos.length === 0) {
            return res.status(200).json({ success: true, orders: [] });
        }

        const ordersWithDetails = await Promise.all(
            pedidos.map(async (pedido) => {
                const [detalles] = await dbPool.query(
                    `SELECT dp.ID_Producto, prod.Nombre as name, prod.imagen_url as imageUrl, dp.Cantidad as quantity, dp.Precio_Unitario_Compra as pricePaid
                     FROM detalles_pedido dp
                     JOIN producto prod ON dp.ID_Producto = prod.ID_Producto
                     WHERE dp.ID_Pedido = ?`,
                    [pedido.ID_Pedido]
                );
                return { ...pedido, items: detalles };
            })
        );
        res.status(200).json({ success: true, orders: ordersWithDetails });
    } catch (error) {
        console.error(`!!! Error GET /api/user/orders para Usuario ID ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener el historial de compras.' });
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
    let userEmail = null;
    if (userId && dbPool) {
        const [users] = await dbPool.query('SELECT email FROM usuarios WHERE id = ?', [userId]);
        if (users.length > 0) userEmail = users[0].email;
    }

    wompiTempOrders[reference] = { items, total, userId, customerData, userEmail, timestamp: Date.now() };
    console.log(`\t<-- Orden temporal guardada para Ref: ${reference}. UserID: ${userId}, UserEmail: ${userEmail}`);
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
        console.error(`\t!!! [Webhook Wompi] FIRMA INVÁLIDA para Ref: ${transactionReference}.`);
        return res.status(200).json({ success: true, message: "Firma inválida." });
    }
    console.log(`\t[Webhook Wompi] Firma VÁLIDA para Ref: ${transactionReference}`);

    const orderDetails = wompiTempOrders[transactionReference];
    if (!orderDetails) {
        console.warn(`\t[Webhook Wompi] No se encontraron datos temporales para Ref: ${transactionReference}.`);
        return res.status(200).json({ success: true, message: "Orden no encontrada o ya procesada/expirada." });
    }

    if (transactionStatus === 'APPROVED') {
        let connection;
        try {
            connection = await dbPool.getConnection();
            await connection.beginTransaction();
            console.log("\t\tIniciando transacción DB...");

            for (const item of orderDetails.items) {
                const [updateResult] = await connection.query(
                    'UPDATE producto SET cantidad = GREATEST(0, cantidad - ?) WHERE ID_Producto = ? AND cantidad >= ?',
                    [item.quantity, item.productId, item.quantity]
                );
                if (updateResult.affectedRows === 0) {
                    const [p] = await connection.query('SELECT Nombre, cantidad FROM producto WHERE ID_Producto = ?', [item.productId]);
                    failureMessage = `Stock insuficiente para "${p[0]?.Nombre || `ID ${item.productId}`}". Disponible: ${p[0]?.cantidad || 'N/A'}.`;
                    updateFailed = true; break;
                }
            }

            if (updateFailed) {
                await connection.rollback();
                console.error(`\t\t!!! Rollback (stock fallido): ${failureMessage}`);
            } else {
                // Lógica para obtener ID_Cliente unificada y robusta
                let clienteId = null;
                const customerEmail = eventData.customer_email;
                if (!customerEmail) throw new Error("Wompi no proporcionó un email de cliente.");
                const customerName = orderDetails.customerData?.fullName || eventData.customer_data?.full_name || 'Cliente Wompi';
                clienteId = await getOrCreateClienteId(connection, { username: customerName, email: customerEmail });
                if (!clienteId) {
                    throw new Error(`No se pudo crear o encontrar un ID de cliente para el email ${customerEmail}`);
                }
                const [pedidoResult] = await connection.query(
                    `INSERT INTO pedidos (ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, Referencia_Pago, Nombre_Cliente_Envio, Email_Cliente_Envio, Telefono_Cliente_Envio, Direccion_Envio, Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio, Fecha_Pedido, ID_Cliente)
                     VALUES (?, ?, 'Pagado', 'Wompi', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                    [
                        orderDetails.userId || null,
                        orderDetails.total,
                        transactionReference,
                        eventData.shipping_address?.full_name || customerEmail || 'Cliente Wompi',
                        customerEmail,
                        eventData.shipping_address?.phone_number || 'N/A',
                        `${eventData.shipping_address?.address_line_1 || ''} ${eventData.shipping_address?.address_line_2 || ''}`.trim() || 'N/A',
                        eventData.shipping_address?.region || null,
                        eventData.shipping_address?.city || null,
                        null,
                        clienteId
                    ]
                );
                const pedidoId = pedidoResult.insertId;
                const detallePromises = orderDetails.items.map(item =>
                    connection.query('INSERT INTO detalles_pedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario_Compra) VALUES (?, ?, ?, ?)',
                        [pedidoId, item.productId, item.quantity, item.price])
                );
                await Promise.all(detallePromises);
                await connection.commit();
                console.log(`\t\tCommit: Pedido ${pedidoId} guardado. Stock actualizado.`);
                delete wompiTempOrders[transactionReference];
            }
            res.status(200).json({ success: true, message: `Webhook procesado. Estado: ${transactionStatus}. DB: ${updateFailed ? `FALLIDO - ${failureMessage}` : 'OK'}` });
        } catch (dbError) {
            console.error(`\t\t!!! Error DB crítico para Ref: ${transactionReference}:`, dbError);
            if (connection) { try { await connection.rollback(); console.log("\t\tRollback por error crítico."); } catch (rErr) { console.error("!!! Error en Rollback:", rErr); } }
            res.status(200).json({ success: true, message: "Error interno DB." });
        } finally {
            if (connection) { connection.release(); console.log("\t\tConexión DB liberada."); }
        }
    } else { 
        console.log(`\t[Webhook Wompi] Estado ${transactionStatus} para Ref: ${transactionReference}.`);
        if (['DECLINED', 'VOIDED', 'ERROR'].includes(transactionStatus)) {
             delete wompiTempOrders[transactionReference];
             console.log(`\t\tDatos temporales eliminados para Ref: ${transactionReference}.`);
        }
        res.status(200).json({ success: true, message: `Webhook procesado. Estado: ${transactionStatus}` });
    }
});

// --- RUTAS DE PEDIDO CONTRA ENTREGA ---
app.post('/api/orders/cash-on-delivery', async (req, res) => {
    console.log("--> POST /api/orders/cash-on-delivery");
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
                throw new Error(`Stock insuficiente para ${productDB[0].Nombre}. Disponible: ${productDB[0].cantidad}, Solicitado: ${item.quantity}.`);
            }
            item.price = productDB[0].precio_unitario;
            totalPedido += item.price * item.quantity;
        }

        // Lógica para obtener ID_Cliente unificada y robusta
        let clienteId = null;
        const customerEmail = customerInfo.email;
        const customerName = customerInfo.name;
        clienteId = await getOrCreateClienteId(connection, { username: customerName, email: customerEmail });
        if (!clienteId) {
            throw new Error(`No se pudo crear o encontrar un ID de cliente para el email ${customerEmail}`);
        }
        const [pedidoResult] = await connection.query(
            `INSERT INTO pedidos (ID_Usuario, Total_Pedido, Estado_Pedido, Metodo_Pago, Nombre_Cliente_Envio, Direccion_Envio, Departamento_Envio, Ciudad_Envio, Punto_Referencia_Envio, Telefono_Cliente_Envio, Email_Cliente_Envio, Fecha_Pedido, ID_Cliente)
             VALUES (?, ?, 'Pendiente de Confirmacion', 'ContraEntrega', ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                customerInfo.userId || null, // CORRECCIÓN AQUÍ
                totalPedido,
                customerInfo.name,
                customerInfo.address,
                customerInfo.department,
                customerInfo.city,
                customerInfo.referencePoint || null,
                customerInfo.phone,
                customerInfo.email,
                clienteId
            ]
        );
        const pedidoId = pedidoResult.insertId;
        for (const item of cart) {
            await connection.query('INSERT INTO detalles_pedido (ID_Pedido, ID_Producto, Cantidad, Precio_Unitario_Compra) VALUES (?, ?, ?, ?)', [pedidoId, item.productId, item.quantity, item.price]);
            await connection.query('UPDATE producto SET cantidad = cantidad - ? WHERE ID_Producto = ?', [item.quantity, item.productId]);
        }
        await connection.commit();
        res.status(201).json({ success: true, message: "Pedido contra entrega recibido.", orderId: pedidoId });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("!!! Error procesando pedido contra entrega:", error);
        res.status(error.message.includes("Stock insuficiente") ? 409 : 500).json({ success: false, message: error.message || "Error interno." });
    } finally {
        if (connection) connection.release();
    }
});

// --- RUTAS DE ADMINISTRACIÓN ---
app.get('/api/admin/products', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado en admin/products"); const [r] = await dbPool.query('SELECT * FROM producto ORDER BY ID_Producto ASC'); res.status(200).json(r); } 
    catch (e) { console.error("Error GET admin/products:", e); res.status(500).json({ success: false, message: e.message }); }
});
app.get('/api/admin/products/:id', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado"); const { id } = req.params; if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
        const [r] = await dbPool.query('SELECT * FROM producto WHERE ID_Producto = ?', [id]);
        if (r.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' }); res.status(200).json(r[0]);
    } catch (e) { console.error("Error GET admin/products/:id:", e); res.status(500).json({ success: false, message: e.message }); }
});
app.post('/api/admin/products', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado"); const p = req.body; if (!p.Nombre||p.precio_unitario===undefined||p.cantidad===undefined||!p.Marca) return res.status(400).json({message:'Faltan datos.'});
        const pr=parseFloat(p.precio_unitario), cn=parseInt(p.cantidad,10), ci=p.ID_Categoria?parseInt(p.ID_Categoria,10):null;
        if(isNaN(pr)||pr<0||isNaN(cn)||cn<0||(p.ID_Categoria&&isNaN(ci))) return res.status(400).json({message:'Datos numéricos inválidos.'});
        const sql = `INSERT INTO producto (Nombre,Descripcion,precio_unitario,Marca,Codigo_Barras,ID_Categoria,cantidad,imagen_url,imagen_url_2,imagen_url_3,imagen_url_4,imagen_url_5) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
        const v = [p.Nombre,p.Descripcion||null,pr,p.Marca,p.Codigo_Barras||null,ci,cn,p.imagen_url||null,p.imagen_url_2||null,p.imagen_url_3||null,p.imagen_url_4||null,p.imagen_url_5||null];
        const [re] = await dbPool.query(sql,v); res.status(201).json({success:true,message:'Producto añadido.', productId:re.insertId});
    } catch (e) { console.error("Error POST admin/products:",e); if(e.code==='ER_DUP_ENTRY') return res.status(409).json({message:'Cód. Barras duplicado.'}); res.status(500).json({success:false,message:e.message});}
});
app.put('/api/admin/products/:id', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado"); const {id}=req.params; if(isNaN(id)) return res.status(400).json({message:'ID inválido.'});
        const p=req.body; if(!p.Nombre||p.precio_unitario===undefined||p.cantidad===undefined||!p.Marca) return res.status(400).json({message:'Faltan datos.'});
        const pr=parseFloat(p.precio_unitario), cn=parseInt(p.cantidad,10), ci=p.ID_Categoria?parseInt(p.ID_Categoria,10):null;
        if(isNaN(pr)||pr<0||isNaN(cn)||cn<0||(p.ID_Categoria&&isNaN(ci))) return res.status(400).json({message:'Datos numéricos inválidos.'});
        const sql = `UPDATE producto SET Nombre=?,Descripcion=?,precio_unitario=?,Marca=?,Codigo_Barras=?,ID_Categoria=?,cantidad=?,imagen_url=?,imagen_url_2=?,imagen_url_3=?,imagen_url_4=?,imagen_url_5=? WHERE ID_Producto=?`;
        const v = [p.Nombre,p.Descripcion||null,pr,p.Marca,p.Codigo_Barras||null,ci,cn,p.imagen_url||null,p.imagen_url_2||null,p.imagen_url_3||null,p.imagen_url_4||null,p.imagen_url_5||null,id];
        const [re] = await dbPool.query(sql,v); if(re.affectedRows===0) return res.status(404).json({message:'Producto no encontrado.'});
        res.status(200).json({success:true,message:'Producto actualizado.'});
    } catch (e) { console.error("Error PUT admin/products/:id:",e); if(e.code==='ER_DUP_ENTRY') return res.status(409).json({message:'Cód. Barras duplicado.'}); res.status(500).json({success:false,message:e.message});}
});
app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado"); const {id}=req.params; if(isNaN(id)) return res.status(400).json({message:'ID inválido.'});
        const [re] = await dbPool.query('DELETE FROM producto WHERE ID_Producto=?',[id]);
        if(re.affectedRows===0) return res.status(404).json({message:'Producto no encontrado.'});
        res.status(200).json({success:true,message:'Producto eliminado.'});
    } catch (e) { console.error("Error DELETE admin/products/:id:",e); if(e.code==='ER_ROW_IS_REFERENCED_2') return res.status(409).json({message:'Producto referenciado, no se puede eliminar.'}); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/users', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado"); const [u] = await dbPool.query('SELECT id,username,email,role FROM usuarios ORDER BY id DESC'); res.status(200).json(u); }
    catch (e) { console.error("Error GET admin/users:",e); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/settings', checkAdmin, (req, res) => { res.status(200).json({success:true, settings:siteSettings});});
app.put('/api/admin/settings', checkAdmin, async (req, res) => {
    const newSettings = req.body; const allowed=['colorPrimary','colorSecondary','colorAccent','welcomeTitle','promoBannerTitle','promoBannerText','contactAddress','contactPhone','contactEmail','socialFacebook','socialTwitter','socialInstagram','socialYoutube'];
    let ops=[], changed=false;
    try { if (!dbPool) throw new Error("dbPool no inicializado");
        for(const k in newSettings){
            if(allowed.includes(k) && newSettings[k]!==undefined){
                if(k.startsWith('color')&&typeof newSettings[k]==='string'&&!/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(newSettings[k])) continue;
                if(k.startsWith('social')&&typeof newSettings[k]==='string'&&newSettings[k]&&!newSettings[k].startsWith('http')) continue;
                const val = typeof newSettings[k]==='string'?newSettings[k].trim():newSettings[k]; const finalVal=(val===null||val===undefined)?'':val;
                if(siteSettings[k]!==finalVal){ siteSettings[k]=finalVal; changed=true; ops.push(dbPool.query('INSERT INTO site_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=?',[k,siteSettings[k],siteSettings[k]]));}
            }
        }
        if(ops.length>0){ await Promise.all(ops); res.status(200).json({success:true,message:'Configuración actualizada.',settings:siteSettings});}
        else if(changed){res.status(200).json({success:true,message:'Configuración actualizada (sin cambios BD).',settings:siteSettings});}
        else{res.status(200).json({success:true,message:'No se proporcionaron datos válidos para actualizar.',settings:siteSettings});}
    } catch (e) { console.error("Error PUT admin/settings:",e); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/orders', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado");
        const [p] = await dbPool.query(`SELECT ped.ID_Pedido, ped.Fecha_Pedido, ped.Total_Pedido, ped.Estado_Pedido, ped.Metodo_Pago, ped.Referencia_Pago, COALESCE(u.username, ped.Nombre_Cliente_Envio) as Cliente_Nombre, COALESCE(u.email, ped.Email_Cliente_Envio) as Cliente_Email FROM pedidos ped LEFT JOIN usuarios u ON ped.ID_Usuario = u.id ORDER BY ped.Fecha_Pedido DESC`);
        res.status(200).json(p);
    } catch(e){ console.error("Error GET admin/orders:",e); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/orders/:id', checkAdmin, async (req,res)=>{
    try { if (!dbPool) throw new Error("dbPool no inicializado"); const {id}=req.params; if(isNaN(id))return res.status(400).json({message:'ID inválido.'});
        const [pi]=await dbPool.query(`SELECT p.*, COALESCE(u.username, p.Nombre_Cliente_Envio) as Cliente_Nombre, COALESCE(u.email, p.Email_Cliente_Envio) as Cliente_Email FROM pedidos p LEFT JOIN usuarios u ON p.ID_Usuario=u.id WHERE p.ID_Pedido=?`,[id]);
        if(pi.length===0)return res.status(404).json({message:'Pedido no encontrado.'});
        const [d]=await dbPool.query(`SELECT dp.*, pr.Nombre as Nombre_Producto, pr.imagen_url as Imagen_Producto FROM detalles_pedido dp JOIN producto pr ON dp.ID_Producto=pr.ID_Producto WHERE dp.ID_Pedido=?`,[id]);
        res.status(200).json({...pi[0],detalles:d});
    }catch(e){ console.error("Error GET admin/orders/:id:",e); res.status(500).json({success:false,message:e.message});}
});
app.put('/api/admin/orders/:id/status', checkAdmin, async (req,res)=>{
    try { if (!dbPool) throw new Error("dbPool no inicializado"); const {id}=req.params; const {nuevoEstado}=req.body; const valid=['Pendiente de Pago','Pagado','Procesando','Enviado','Entregado','Cancelado','Pendiente de Confirmacion'];
        if(!valid.includes(nuevoEstado))return res.status(400).json({message:'Estado inválido.'});
        const [r]=await dbPool.query('UPDATE pedidos SET Estado_Pedido=? WHERE ID_Pedido=?',[nuevoEstado,id]);
        if(r.affectedRows===0)return res.status(404).json({message:'Pedido no encontrado.'});
        res.status(200).json({success:true,message:'Estado actualizado.'});
    }catch(e){ console.error("Error PUT admin/orders/:id/status:",e); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/analytics/sales-overview', checkAdmin, async (req,res)=>{
    try{ if (!dbPool) throw new Error("dbPool no inicializado");
        const [ds]=await dbPool.query(`SELECT DATE_FORMAT(Fecha_Pedido,'%Y-%m-%d') as dia, SUM(Total_Pedido) as total_ventas FROM pedidos WHERE Estado_Pedido IN ('Pagado','Entregado','Enviado') AND Fecha_Pedido >= CURDATE()-INTERVAL 30 DAY GROUP BY DATE_FORMAT(Fecha_Pedido,'%Y-%m-%d') ORDER BY dia ASC`);
        const [tp]=await dbPool.query(`SELECT p.Nombre, SUM(dp.Cantidad) as total_vendido FROM detalles_pedido dp JOIN producto p ON dp.ID_Producto=p.ID_Producto JOIN pedidos ped ON dp.ID_Pedido=ped.ID_Pedido WHERE ped.Estado_Pedido IN ('Pagado','Entregado','Enviado') GROUP BY dp.ID_Producto,p.Nombre ORDER BY total_vendido DESC LIMIT 10`);
        res.status(200).json({dailySales:ds,topProducts:tp});
    }catch(e){ console.error("Error GET admin/analytics/sales:",e); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/analytics/product-views', checkAdmin, async (req,res)=>{
    try{ if (!dbPool) throw new Error("dbPool no inicializado");
        const [pv]=await dbPool.query(`SELECT p.Nombre, COUNT(vp.ID_Vista) as total_vistas FROM vistas_producto vp JOIN producto p ON vp.ID_Producto=p.ID_Producto GROUP BY vp.ID_Producto,p.Nombre ORDER BY total_vistas DESC LIMIT 20`);
        res.status(200).json(pv);
    }catch(e){ console.error("Error GET admin/analytics/views:",e); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/orders/pending-count', checkAdmin, async (req,res)=>{
    try{ if (!dbPool) throw new Error("dbPool no inicializado");
        const [r]=await dbPool.query("SELECT COUNT(*) as pendingCount FROM pedidos WHERE Estado_Pedido IN ('Pendiente de Confirmacion','Pagado')");
        res.status(200).json({success:true,pendingCount:r[0]?.pendingCount||0});
    }catch(e){ console.error("Error GET admin/orders/pending:",e); res.status(500).json({success:false,message:e.message});}
});
app.get('/api/admin/contact-messages', checkAdmin, async (req, res) => {
    try { if (!dbPool) throw new Error("dbPool no inicializado");
        const [messages] = await dbPool.query('SELECT id, name, email, subject, LEFT(message, 100) as message_preview, created_at FROM contact_messages ORDER BY created_at DESC');
        res.status(200).json(messages);
    } catch (error) { console.error("Error GET admin/contact-messages:",error); res.status(500).json({ success: false, message: error.message }); }
});

// --- CONFIGURACIÓN DE NODEMAILER (después de las configs de wompi, gemini, etc.) ---
let transporter;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASS,
        },
    });
    console.log("--> Transportador de Nodemailer (Gmail) configurado correctamente.");
} else {
    console.warn("!!! Faltan credenciales GMAIL_USER o GMAIL_APP_PASS. La función de responder mensajes no funcionará.");
}

// --- NUEVA RUTA PARA OBTENER MENSAJES DE CONTACTO ---
app.get('/api/admin/messages', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/messages (Admin)");
    try {
        const [messages] = await dbPool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        // --- LOG DE DEPURACIÓN CRUCIAL ---
        console.log(`\t<-- Consulta a DB devolvió ${messages.length} mensajes.`);
        res.status(200).json({ success: true, messages: messages });
    } catch (error) {
        console.error("!!! Error en /api/admin/messages:", error);
        res.status(500).json({ success: false, message: 'Error al cargar los mensajes desde el servidor.' });
    }
});

// --- NUEVA RUTA PARA ENVIAR RESPUESTA POR CORREO ---
app.post('/api/admin/reply-message', checkAdmin, async (req, res) => {
    const { recipientEmail, subject, body } = req.body;
    console.log(`--> POST /api/admin/reply-message a: ${recipientEmail}`);

    if (!transporter) {
        return res.status(503).json({ success: false, message: 'El servicio de correo no está configurado en el servidor.' });
    }
    if (!recipientEmail || !subject || !body) {
        return res.status(400).json({ success: false, message: 'Faltan datos para enviar la respuesta.' });
    }

    const mailOptions = {
        from: `"Ferremax" <${process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject: `Re: ${subject}`,
        html: `
            <p>Hola,</p>
            <p>Gracias por contactar a Ferremax. Aquí tienes la respuesta a tu consulta:</p>
            <blockquote style="border-left: 2px solid #ccc; padding-left: 1em; margin-left: 1em; color: #555;">
                ${body}
            </blockquote>
            <p>Saludos,<br>El equipo de Ferremax</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`\t<-- Respuesta enviada exitosamente a ${recipientEmail}`);
        res.status(200).json({ success: true, message: 'Respuesta enviada con éxito.' });
    } catch (error) {
        console.error("!!! Error al enviar correo con Nodemailer:", error);
        res.status(500).json({ success: false, message: 'Error al enviar el correo.' });
    }
});

// --- RUTA PARA ACTUALIZAR EL ESTADO DE UN MENSAJE (LEÍDO, ARCHIVADO) ---
app.patch('/api/admin/messages/:id/status', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'read', 'unread', 'archived'

    if (!['read', 'unread', 'archived'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }

    try {
        await dbPool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ success: true, message: `Mensaje actualizado a ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el estado del mensaje.' });
    }
});

// --- RUTA PARA DESTACAR/DES-DESTACAR UN MENSAJE ---
app.patch('/api/admin/messages/:id/star', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { is_starred } = req.body; // true o false

    try {
        await dbPool.query('UPDATE contact_messages SET is_starred = ? WHERE id = ?', [is_starred, id]);
        res.status(200).json({ success: true, message: `Mensaje ${is_starred ? 'destacado' : 'des-destacado'}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al destacar el mensaje.' });
    }
});

// --- RUTA PARA ELIMINAR UN MENSAJE ---
app.delete('/api/admin/messages/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await dbPool.query('DELETE FROM contact_messages WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Mensaje eliminado permanentemente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar el mensaje.' });
    }
});

// --- RUTA DEL ASISTENTE IA (GEMINI) ---
app.post('/api/ai-assistant/chat', async (req, res) => {
    const userMessage = req.body.message;
    console.log(`\n[AI ASSISTANT START] User message: "${userMessage}"`);

    if (!userMessage) {
        console.warn("[AI ASSISTANT] Mensaje vacío recibido.");
        return res.status(400).json({ success: false, message: "Mensaje vacío." });
    }
    if (!geminiModel) {
        console.warn("[AI ASSISTANT] Modelo Gemini no inicializado.");
        return res.status(503).json({ success: false, message: "Asistente IA (Gemini) no disponible en este momento." });
    }
    if (!dbPool) {
        console.error("[AI ASSISTANT] dbPool no está inicializado. No se puede acceder a la base de datos.");
        return res.status(500).json({ success: false, message: "Error interno del servidor: Conexión a BD no disponible." });
    }

    try {
        let productContext = "No se buscaron productos específicos para esta consulta general.";
        const originalKeywords = userMessage.toLowerCase().match(/\b(\w{4,})\b/g) || [];
        const stopWords = ['hola', 'buenos', 'dias', 'tardes', 'noches', 'quiero', 'saber', 'sobre', 'cuánto', 'cuesta', 'precio', 'dime', 'busco', 'tienes', 'qué', 'como', 'para', 'con', 'por', 'sin', 'desde', 'hacia', 'hasta', 'cuales', 'tienen', 'ustedes', 'ferremax', 'favor', 'podrias', 'ayudarme', 'necesito', 'informacion', 'gracias', 'muy', 'muchas', 'disculpa', 'pregunta'];
        const keywords = originalKeywords.filter(word => !stopWords.includes(word));

        if (keywords.length > 0) {
            let querySql = 'SELECT ID_Producto, Nombre, Descripcion, precio_unitario, cantidad, Marca FROM producto WHERE ';
            const conditions = [];
            const queryParams = [];
            keywords.forEach(keyword => {
                conditions.push('(LOWER(Nombre) LIKE ? OR LOWER(Descripcion) LIKE ?)');
                queryParams.push(`%${keyword.toLowerCase()}%`, `%${keyword.toLowerCase()}%`);
            });
            querySql += conditions.join(' OR ');
            querySql += ' LIMIT 5';

            const [productsDB] = await dbPool.query(querySql, queryParams);
            if (productsDB.length > 0) {
                productContext = "Información de productos de Ferremax que podrían ser relevantes:\n";
                productsDB.forEach(p => {
                    // <<< AÑADIR EL ID_Producto AL CONTEXTO >>>
                    productContext += `- ID: ${p.ID_Producto}, Nombre: ${p.Nombre}, Marca: ${p.Marca}, Precio: ${p.precio_unitario} COP, Stock: ${p.cantidad}. ${p.Descripcion ? 'Descripción breve: ' + p.Descripcion.substring(0, 80) + '...' : ''}\n`;
                });
            } else {
                productContext = "No encontré productos en la base de datos de Ferremax que coincidan directamente con las palabras clave específicas de tu consulta ('" + keywords.join("', '") + "').\n";
            }
        } else {
            productContext = "No se identificaron palabras clave específicas de productos en tu consulta para buscar en la base de datos. Puedo ayudarte con información general o sobre categorías.\n"
        }

        // Información de políticas directamente en el prompt
        const ferremaxPolicies = `
Políticas de Ferremax:
- Política de Privacidad: Nos tomamos muy en serio la privacidad. Usamos tu información solo para brindarte el mejor servicio y no la compartimos sin tu consentimiento. Cumplimos con las leyes de protección de datos.
- Política de Devoluciones: Tienes 30 días para devoluciones en productos defectuosos o no satisfactorios. Contáctanos para iniciar el proceso. El producto debe estar en estado original y con embalaje completo.
- Política de Envío: Hacemos envíos a nivel nacional. Los costos y tiempos varían (generalmente 3-7 días hábiles). Se calculan al comprar. Te informaremos de retrasos.
- Política de Seguridad: Usamos tecnología de encriptación para proteger tus datos de pago. Implementamos medidas para evitar accesos no autorizados.
- Política de Atención al Cliente: Nos comprometemos a un excelente servicio. Contáctanos por el formulario o correo; respondemos en 24 horas hábiles.
- Métodos de Pago: Aceptamos pagos vía Wompi (tarjetas crédito/débito PSE, Nequi, Bancolombia a la mano, efectivo en puntos) y también Pago Contra Entrega.
`;


        // --- INSTRUCCIÓN DE SISTEMA MEJORADA ---
        const systemInstruction = `Eres Ferremax IA, un asistente virtual experto y amigable de la ferretería Ferremax. Tu misión es ayudar a los clientes con sus preguntas sobre productos y políticas.

Reglas de respuesta:
1.  Basa tus respuestas ESTRICTA Y ÚNICAMENTE en la información de "Contexto de Productos" y "Políticas de la Tienda" que te proporciono.
2.  **¡IMPORTANTE! Si mencionas un producto específico del contexto, DEBES formatearlo como un enlace Markdown usando su ID. La sintaxis es: [Nombre del Producto](/products/ID_DEL_PRODUCTO). Ejemplo: "Claro, tenemos el [Rotomartillo MaxForce 800W](/products/15) en stock."**
3.  Al mencionar un producto, SIEMPRE incluye su nombre, precio y stock si están disponibles.
4.  NO REDIRIJA AL USUARIO a "la página web" o a "visitar una sección", ya que el usuario ya está aquí y tú tienes la información. Proporciona la respuesta directamente.
5.  Si no encuentras un producto específico, informa al usuario amablemente y sugiérele que revise las categorías o sea más específico. No inventes productos ni IDs.
6.  Sé conciso, claro y siempre muy amigable.

---
Políticas de la Tienda:
${ferremaxPolicies}
---
Contexto de Productos (ID, Nombre, Precio, Stock, Descripción):
${productContext} 
---
Pregunta del cliente:`;

        const fullPrompt = `${systemInstruction}\n${userMessage}`;
        console.log(`\n[AI PROMPT TO GEMINI START]\n${fullPrompt}\n[AI PROMPT TO GEMINI END]\n`);

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ];

        const generationConfig = {
            temperature: 0.3, // Un poco más bajo para ser más factual con las políticas
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500, // Aumentado un poco por si las políticas son largas
        };
        
        const chatSession = geminiModel.startChat({
            generationConfig,
            safetySettings,
            history: [ /* Aquí podrías agregar el historial de la conversación si lo implementas */ ]
          });
        
        const result = await chatSession.sendMessage(fullPrompt);
        
        const response = result.response;
        const aiReply = response.text();

        if (!aiReply) {
            if (response.promptFeedback && response.promptFeedback.blockReason) {
                console.warn(`\t[Gemini] Respuesta bloqueada. Razón: ${response.promptFeedback.blockReason}`);
                throw new Error(`Respuesta bloqueada por Gemini: ${response.promptFeedback.blockReason}`);
            }
            console.warn("\t[Gemini] Respuesta vacía recibida del modelo.");
            throw new Error("El asistente IA no pudo generar una respuesta.");
        }

        console.log(`[AI RESPONSE FROM GEMINI] "${aiReply}"`);
        res.json({ success: true, reply: aiReply });

    } catch (error) {
        console.error("!!! Error en /api/ai-assistant/chat (Gemini):", error);
        res.status(500).json({ success: false, message: error.message || "Error al procesar tu solicitud con el asistente IA (Gemini)." });
    }
    console.log(`[AI ASSISTANT END] Para mensaje: "${userMessage}"`);
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