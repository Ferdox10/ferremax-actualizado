// server.js - Servidor Backend Unificado para Ferremax con Wompi, Admin CRUD y
// Personalización
// Versión que lee la configuración de la DB desde variables de entorno estándar (.env
// localmente)
// Añadido SSL para conexión a TiDB Cloud
// --- MODIFICADO: Ahora maneja hasta 5 URLs de imagen por producto ---

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

if (!WOMPI_PUBLIC_KEY || !WOMPI_PRIVATE_KEY || !WOMPI_EVENTS_SECRET ||
    !FRONTEND_URL) {
    console.error("\n!!! ERROR FATAL: Faltan variables de entorno críticas (WOMPI_*, FRONTEND_URL) en la configuración del servicio.\n");
    if (isProduction) process.exit(1);
}
console.log(`--> Llave Pública Wompi (Backend): ...${WOMPI_PUBLIC_KEY ? WOMPI_PUBLIC_KEY.slice(-6) : 'NO DEFINIDA'}`);
console.log(`--> URL Frontend para Redirección: ${FRONTEND_URL || 'NO DEFINIDA'}`);
console.log(`--> Entorno Node.js: ${process.env.NODE_ENV || 'development (default)'}`);


// --- ALMACENAMIENTO SIMULADO DE CONFIGURACIÓN DEL SITIO ---
// (Mantenido igual, ya que la personalización actual no guarda en DB)
let siteSettings = {
    colorPrimary: '#ea580c',
    colorSecondary: '#047857',
    colorAccent: '#f3f4f6',
    welcomeTitle: 'Bienvenido a Ferremax',
    promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
    promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!'
};
console.log("--> Configuración inicial del sitio (simulada):", siteSettings);

// --- ALMACENAMIENTO TEMPORAL PARA ÓRDENES WOMPI ---
const wompiTempOrders = {};
const WOMPI_TEMP_ORDER_TIMEOUT = 1000 * 60 * 30; // 30 minutos

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
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        // *** AÑADIDO: Configuración SSL requerida por TiDB Cloud ***
        ssl: {
            // rejectUnauthorized: true // Opción más segura, requiere que el certificado CA sea válido y confiable por Node.js
            // Si da error con true, prueba comentándola o con false SOLO para probar la conexión inicial.
            // Para producción, lo ideal es true y si es necesario, especificar el CA de TiDB Cloud.
            // Por ahora, un objeto vacío o { rejectUnauthorized: true } suele funcionar si el CA es estándar.
            rejectUnauthorized: true // Empezamos con la opción segura
        }
    });

    // Probar conexión inicial
    dbPool.getConnection()
        .then(connection => {
            console.log(`--> Conexión exitosa a la base de datos '${connection.config.database}' en ${connection.config.host}:${connection.config.port}`);
            connection.release();
        })
        .catch(err => {
            console.error(`!!! Error de conexión inicial a la base de datos (${err.code || 'N/A'}): ${err.message}`);
            // Loguear detalles del error SSL si existen
            if (err.message.includes('SSL')) {
                console.error("--> Detalle SSL:", err);
            }
            // Considerar salir si la conexión inicial falla en producción
            // if (isProduction) process.exit(1);
        });

} catch (error) {
    console.error("!!! Error CRÍTICO al crear el pool de conexiones a la DB:", error);
    if (isProduction) process.exit(1);
}

// --- MIDDLEWARE DE AUTENTICACIÓN ADMIN ---
const checkAdmin = (req, res, next) => {
    // Simulación simple - ¡NO USAR EN PRODUCCIÓN REAL!
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
            [username, email, hashedPassword, 'cliente'] // Rol por defecto
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
        // CHANGED: Seleccionar todas las URLs de imagen
        const [results] = await dbPool.query(
            `SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca,
             Codigo_Barras, ID_Categoria, cantidad, imagen_url,
             imagen_url2, imagen_url3, imagen_url4, imagen_url5
             FROM producto`
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
         // CHANGED: Seleccionar todas las URLs de imagen
        const [results] = await dbPool.query(
            `SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca,
             Codigo_Barras, ID_Categoria, cantidad, imagen_url,
             imagen_url2, imagen_url3, imagen_url4, imagen_url5
             FROM producto WHERE ID_Producto = ?`,
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

// Simulación simple, no guarda en DB
app.post('/api/contact', async (req, res) => {
    console.log("--> POST /api/contact (Simulado)");
    try {
        const { name, email, subject, message } = req.body;
         if (!name || !email || !subject || !message) {
             console.warn("\tContacto simulado: Faltan datos.");
            return res.status(400).json({ success: false, message: "Faltan datos en el formulario de contacto." });
        }
        console.log(`\tMensaje contacto RECIBIDO (Simulado): De ${name} <${email}> Asunto: ${subject}`);
        console.log(`\tMensaje: ${message}`);
        // En una app real, aquí enviarías un email o guardarías en DB
        res.status(200).json({ success: true, message: 'Mensaje recibido correctamente (simulación).' });
    } catch (error) {
        console.error("!!! Error simulando recepción de contacto:", error);
        res.status(500).json({ success: false, message: "Error interno al procesar el mensaje." });
    }
});

// --- RUTAS WOMPI ---
// (Lógica de Wompi sin cambios funcionales respecto a imágenes)
app.post('/api/wompi/temp-order', async (req, res) => {
    const { reference, items, total } = req.body;
    console.log(`--> POST /api/wompi/temp-order (Ref: ${reference})`);

    if (!reference || !Array.isArray(items) || items.length === 0 || total === undefined || total < 0) {
        console.warn("\tSolicitud rechazada: Datos inválidos para orden temporal.");
        return res.status(400).json({ success: false, message: 'Datos inválidos para orden temporal.' });
    }
    const hasInvalidItem = items.some(item => !item.productId || !item.quantity || item.quantity <= 0 || item.price === undefined || item.price < 0);
    if (hasInvalidItem) {
        console.warn("\tSolicitud rechazada: Items inválidos en orden temporal.");
        return res.status(400).json({ success: false, message: 'Items inválidos en orden temporal.' });
    }

    wompiTempOrders[reference] = { items: items, total: total, timestamp: Date.now() };
    console.log(`\t<-- Orden temporal guardada para Ref: ${reference}`);

    // Limpiar orden temporal después de un tiempo
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

    // Validar payload básico
    if (!signatureReceived || !eventData || !timestamp || !eventData.reference ||
        eventData.amount_in_cents === undefined || !eventData.currency || !eventData.status) {
        console.warn("\t[Webhook Wompi] Rechazado: Payload inválido o incompleto.");
        // Wompi espera 200 OK incluso si no procesamos
        return res.status(200).json({ success: false, message: "Payload inválido o incompleto." });
    }

    const { reference: transactionReference, status: transactionStatus, amount_in_cents: amountInCents, currency } = eventData;

    // Verificar firma
    const stringToSign = `${transactionReference}${amountInCents}${currency}${transactionStatus}${timestamp}${WOMPI_EVENTS_SECRET}`;
    const expectedSignature = crypto.createHash('sha256').update(stringToSign).digest('hex');

    console.log(`\tRef: ${transactionReference}, Status: ${transactionStatus}, Amount: ${amountInCents} ${currency}`);

    if (signatureReceived !== expectedSignature) {
        console.error(`\t!!! [Webhook Wompi] FIRMA INVÁLIDA para Ref: ${transactionReference}. ¡POSIBLE FRAUDE!`);
        // Wompi espera 200 OK
        return res.status(200).json({ success: true, message: "Firma inválida." }); // Respondemos success:true pero con mensaje de error
    }

    console.log(`\t[Webhook Wompi] Firma VÁLIDA para Ref: ${transactionReference}`);

    // Buscar orden temporal
    const orderDetails = wompiTempOrders[transactionReference];
    if (!orderDetails) {
        console.warn(`\t[Webhook Wompi] No se encontraron datos temporales para Ref: ${transactionReference}. Pudo expirar, ser procesada ya, o ser una transacción antigua/inválida.`);
        return res.status(200).json({ success: true, message: "Orden no encontrada o ya procesada/expirada." });
    }

    // Procesar según estado
    if (transactionStatus === 'APPROVED') {
        console.log(`\t[Webhook Wompi] Transacción APROBADA para Ref: ${transactionReference}. Intentando actualizar stock...`);
        let connection;
        let updateFailed = false;
        let failureMessage = '';

        try {
            connection = await dbPool.getConnection();
            await connection.beginTransaction();
            console.log("\t\tIniciando transacción DB para actualizar stock...");

            const orderItems = orderDetails.items;
            const updatePromises = orderItems.map(item => {
                console.log(`\t\t- Descontando ${item.quantity} de stock para Producto ID: ${item.productId}`);
                // Usar GREATEST(0, ...) para evitar stock negativo
                return connection.query(
                    'UPDATE producto SET cantidad = GREATEST(0, cantidad - ?) WHERE ID_Producto = ? AND cantidad >= ?',
                    [item.quantity, item.productId, item.quantity]
                );
            });

            const updateResults = await Promise.all(updatePromises);

            // Verificar si alguna actualización falló (stock insuficiente)
            for (let i = 0; i < updateResults.length; i++) {
                const [result] = updateResults[i]; // mysql2/promise devuelve [result, fields]
                if (result.affectedRows === 0) {
                    updateFailed = true;
                    const failedItem = orderItems[i];
                    const [checkProduct] = await connection.query('SELECT Nombre, cantidad FROM producto WHERE ID_Producto = ?', [failedItem.productId]);
                    const productName = checkProduct.length > 0 ? checkProduct[0].Nombre : `ID ${failedItem.productId}`;
                    const currentStock = checkProduct.length > 0 ? checkProduct[0].cantidad : 'N/A';
                    failureMessage = `No se pudo actualizar stock para "${productName}" (ID: ${failedItem.productId}). Stock actual: ${currentStock}, Se intentó restar: ${failedItem.quantity}.`;
                    console.error(`\t\t!!! Error DB: ${failureMessage}`);
                    break; // Salir del bucle al primer error
                }
            }

            if (updateFailed) {
                await connection.rollback();
                console.error(`\t\t!!! Rollback DB ejecutado para Ref: ${transactionReference} debido a: ${failureMessage}`);
            } else {
                await connection.commit();
                console.log(`\t\tCommit DB exitoso. Stock actualizado para Ref: ${transactionReference}.`);
                // Eliminar orden temporal solo si el commit fue exitoso
                delete wompiTempOrders[transactionReference];
                console.log(`\t\tDatos temporales eliminados para Ref: ${transactionReference}.`);
            }

             res.status(200).json({
                success: true,
                message: `Webhook procesado. Estado Wompi: ${transactionStatus}. Resultado DB: ${updateFailed ? `FALLIDO (Rollback - ${failureMessage})` : 'OK (Commit)'}`
             });


        } catch (dbError) {
            console.error(`\t\t!!! Error CRÍTICO DB durante actualización de stock para Ref: ${transactionReference}:`, dbError);
            if (connection) {
                try { await connection.rollback(); console.log("\t\tRollback DB ejecutado por error crítico."); }
                catch (rollErr) { console.error("\t\t!!! Error durante Rollback:", rollErr); }
            }
            // Informar a Wompi que recibimos, pero hubo error interno
             res.status(200).json({ success: true, message: "Webhook recibido, error interno crítico en DB." });
        } finally {
            if (connection) {
                connection.release();
                console.log("\t\tConexión DB liberada.");
            }
        }

    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(transactionStatus)) {
        console.log(`\t[Webhook Wompi] Transacción ${transactionStatus} para Ref: ${transactionReference}. No se actualiza stock.`);
        // Eliminar orden temporal para estados finales no aprobados
        delete wompiTempOrders[transactionReference];
        console.log(`\t\tDatos temporales eliminados para Ref: ${transactionReference}.`);
        res.status(200).json({ success: true, message: `Webhook procesado. Estado: ${transactionStatus}` });

    } else {
        // Otros estados (e.g., PENDING) - No hacer nada todavía, esperar estado final
        console.log(`\t[Webhook Wompi] Estado no final (${transactionStatus}) para Ref: ${transactionReference}. Esperando estado final.`);
        res.status(200).json({ success: true, message: `Webhook recibido. Estado: ${transactionStatus}` });
    }
});


// --- RUTAS DE ADMINISTRACIÓN ---
app.get('/api/admin/products', checkAdmin, async (req, res) => {
    console.log("--> GET /api/admin/products");
    try {
        // CHANGED: Seleccionar todas las URLs de imagen
        const [results] = await dbPool.query(
            `SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca,
             Codigo_Barras, ID_Categoria, cantidad, imagen_url,
             imagen_url2, imagen_url3, imagen_url4, imagen_url5
             FROM producto ORDER BY ID_Producto ASC`
            );
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
        // CHANGED: Seleccionar todas las URLs de imagen
        const [results] = await dbPool.query(
           `SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca,
             Codigo_Barras, ID_Categoria, cantidad, imagen_url,
             imagen_url2, imagen_url3, imagen_url4, imagen_url5
             FROM producto WHERE ID_Producto = ?`, [id]);
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
        // CHANGED: Extraer todas las URLs de imagen
        const {
            Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras,
            ID_Categoria, cantidad, imagen_url,
            imagen_url2, imagen_url3, imagen_url4, imagen_url5 // Nuevas URLs
        } = req.body;

        console.log("\tDatos recibidos para añadir:", req.body);

        // Validación básica (campos obligatorios)
        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) {
            console.warn("\tValidación fallida: Faltan datos requeridos (*).");
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (Nombre, Precio, Cantidad, Marca).' });
        }

        // Conversión y Validación de tipos
        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        if (isNaN(precioNum) || precioNum < 0) {
            console.warn("\tValidación fallida: Precio inválido.");
            return res.status(400).json({ success: false, message: 'Precio inválido.' });
        }
        if (isNaN(cantidadNum) || cantidadNum < 0) {
             console.warn("\tValidación fallida: Cantidad inválida.");
            return res.status(400).json({ success: false, message: 'Cantidad inválida.' });
        }
        if (ID_Categoria && isNaN(categoriaId)) {
            console.warn("\tValidación fallida: ID Categoría inválido.");
            return res.status(400).json({ success: false, message: 'ID Categoría inválido.' });
        }

        // CHANGED: SQL INSERT con todas las URLs
        const sql = `INSERT INTO producto (
                        Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras,
                        ID_Categoria, cantidad, imagen_url,
                        imagen_url2, imagen_url3, imagen_url4, imagen_url5
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // 12 placeholders

        // CHANGED: Array de valores con todas las URLs (o null)
        const values = [
            Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null,
            categoriaId, cantidadNum, imagen_url || null,
            imagen_url2 || null, imagen_url3 || null, imagen_url4 || null, imagen_url5 || null
        ];

        console.log("\tEjecutando SQL INSERT...");
        const [result] = await dbPool.query(sql, values);
        console.log(`\t<-- Producto añadido con ID: ${result.insertId}`);
        res.status(201).json({ success: true, message: 'Producto añadido exitosamente.', productId: result.insertId });

    } catch (error) {
        console.error('!!! Error POST /api/admin/products:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            console.warn("\tError: Intento de insertar código de barras duplicado.");
            return res.status(409).json({ success: false, message: 'Error: El código de barras ya existe.' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor al añadir el producto.' });
    }
});

app.put('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`--> PUT /api/admin/products/${id}`);
    if (isNaN(id)) {
        console.warn("\tSolicitud rechazada: ID inválido.");
        return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    try {
         // CHANGED: Extraer todas las URLs de imagen
        const {
            Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras,
            ID_Categoria, cantidad, imagen_url,
            imagen_url2, imagen_url3, imagen_url4, imagen_url5 // Nuevas URLs
        } = req.body;
        console.log(`\tDatos recibidos para actualizar ID ${id}:`, req.body);

        // Validación (similar a POST)
        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) {
            console.warn("\tValidación fallida: Faltan datos requeridos (*).");
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos (Nombre, Precio, Cantidad, Marca).' });
        }
        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        if (isNaN(precioNum) || precioNum < 0) return res.status(400).json({ success: false, message: 'Precio inválido.' });
        if (isNaN(cantidadNum) || cantidadNum < 0) return res.status(400).json({ success: false, message: 'Cantidad inválida.' });
        if (ID_Categoria && isNaN(categoriaId)) return res.status(400).json({ success: false, message: 'ID Categoría inválido.' });

        // CHANGED: SQL UPDATE con todas las URLs
        const sql = `UPDATE producto SET
                        Nombre = ?, Descripcion = ?, precio_unitario = ?, Marca = ?, Codigo_Barras = ?,
                        ID_Categoria = ?, cantidad = ?, imagen_url = ?,
                        imagen_url2 = ?, imagen_url3 = ?, imagen_url4 = ?, imagen_url5 = ?
                     WHERE ID_Producto = ?`; // 13 placeholders

        // CHANGED: Array de valores con todas las URLs (o null) y el ID al final
        const values = [
            Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null,
            categoriaId, cantidadNum, imagen_url || null,
            imagen_url2 || null, imagen_url3 || null, imagen_url4 || null, imagen_url5 || null,
            id // ID para el WHERE
        ];

        console.log("\tEjecutando SQL UPDATE...");
        const [result] = await dbPool.query(sql, values);

        if (result.affectedRows === 0) {
            console.log(`\t<-- Producto ID ${id} no encontrado para actualizar`);
            return res.status(404).json({ success: false, message: 'Producto no encontrado para actualizar.' });
        }
        console.log(`\t<-- Producto actualizado ID: ${id}`);
        res.status(200).json({ success: true, message: 'Producto actualizado exitosamente.' });

    } catch (error) {
        console.error(`!!! Error PUT /api/admin/products/${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') {
             console.warn("\tError: Intento de actualizar a un código de barras duplicado.");
            return res.status(409).json({ success: false, message: 'Error: El código de barras ya existe para otro producto.' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar el producto.' });
    }
});

app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    console.log(`--> DELETE /api/admin/products/${id}`);
    if (isNaN(id)) {
        console.warn("\tSolicitud rechazada: ID inválido.");
        return res.status(400).json({ success: false, message: 'ID inválido.' });
    }
    try {
        const sql = 'DELETE FROM producto WHERE ID_Producto = ?';
        console.log("\tEjecutando SQL DELETE...");
        const [result] = await dbPool.query(sql, [id]);

        if (result.affectedRows === 0) {
            console.log(`\t<-- Producto ID ${id} no encontrado para eliminar`);
            return res.status(404).json({ success: false, message: 'Producto no encontrado para eliminar.' });
        }
        console.log(`\t<-- Producto eliminado ID: ${id}`);
        res.status(200).json({ success: true, message: 'Producto eliminado exitosamente.' });

    } catch (error) {
        console.error(`!!! Error DELETE /api/admin/products/${id}:`, error);
         // Manejo de error si hay referencias (ej. en tabla 'ventas' o 'detalle_venta')
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            console.warn(`\tError: Producto ID ${id} está referenciado en otra tabla.`);
            return res.status(409).json({ success: false, message: 'Error: No se puede eliminar el producto porque está referenciado (ej. en ventas).' });
        }
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar el producto.' });
    }
});

// --- Rutas Admin Settings (Simuladas, sin cambios) ---
app.get('/api/admin/settings', checkAdmin, (req, res) => {
    console.log("--> GET /api/admin/settings");
    console.log("\t<-- Devolviendo configuración del sitio (simulada)");
    res.status(200).json({ success: true, settings: siteSettings });
});

app.put('/api/admin/settings', checkAdmin, (req, res) => {
    console.log("--> PUT /api/admin/settings");
    const newSettings = req.body;
    const allowedKeys = ['colorPrimary', 'colorSecondary', 'colorAccent', 'welcomeTitle', 'promoBannerTitle', 'promoBannerText'];
    let updated = false;
    console.log("\tDatos recibidos para actualizar settings:", newSettings);

    for (const key in newSettings) {
        if (allowedKeys.includes(key) && newSettings[key] !== undefined) {
            // Validaciones simples
            if (typeof newSettings[key] === 'string') {
                 // Validar formato color hexadecimal
                if (key.startsWith('color') && !/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(newSettings[key])) {
                     console.warn(`\tIgnorando setting '${key}' por formato de color inválido: ${newSettings[key]}`);
                     continue; // Saltar esta clave
                }
                siteSettings[key] = newSettings[key].trim();
                updated = true;
                console.log(`\tSetting '${key}' actualizado a: '${siteSettings[key]}'`);
            } else {
                 console.warn(`\tIgnorando setting '${key}' por tipo inválido: ${typeof newSettings[key]}`);
            }
        } else {
            console.warn(`\tIgnorando setting no permitido o indefinido: '${key}'`);
        }
    }

    if (updated) {
        console.log("\t<-- Configuración del sitio actualizada (simulada).");
         // Aquí podrías emitir un evento (socket.io) para notificar a los clientes conectados del cambio
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

process.on('SIGINT', gracefulShutdown); // Ctrl+C
process.on('SIGTERM', gracefulShutdown); // kill