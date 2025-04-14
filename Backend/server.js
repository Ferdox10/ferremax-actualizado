// server.js - Servidor Backend Unificado para Ferremax con PayPal, Admin CRUD y Personalización (Revisado)

//--- DEPENDENCIAS ---
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config(); // Carga variables de .env

// --- CONFIGURACIÓN ---
const app = express();
const PORT = process.env.PORT || 4000;
const saltRounds = 10;

// --- CONFIGURACIÓN PAYPAL ---
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error("\n!!! ERROR FATAL: Credenciales de PayPal (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) no definidas en el archivo .env\n");
    process.exit(1);
}

let environment;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    console.log("--> Configurando PayPal en modo: Live (Producción)");
    environment = new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
} else {
    console.log("--> Configurando PayPal en modo: Sandbox (Desarrollo/Pruebas)");
    environment = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
}
let client = new paypal.core.PayPalHttpClient(environment);
console.log(`--> PayPal Client ID (Backend): ...${PAYPAL_CLIENT_ID.slice(-6)}`);

// --- ALMACENAMIENTO SIMULADO DE CONFIGURACIÓN ---
let siteSettings = {
    colorPrimary: '#ea580c', colorSecondary: '#047857', colorAccent: '#f3f4f6',
    welcomeTitle: 'Bienvenido a Ferremax', promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
    promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!'
};
console.log("--> Configuración inicial del sitio (simulada):", siteSettings);


// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- CONEXIÓN BASE DE DATOS ---
let dbPool;
try {
    dbPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'ferremax_db',
        waitForConnections: true, connectionLimit: 10, queueLimit: 0
    });
    dbPool.getConnection()
        .then(connection => {
            console.log(`--> Conexión exitosa a la base de datos '${connection.config.database}' en ${connection.config.host}`);
            connection.release();
        })
        .catch(err => {
            console.error(`!!! Error de conexión a la base de datos (${err.code || 'N/A'}): ${err.message}`);
        });
} catch (error) {
    console.error("!!! Error CRÍTICO al crear el pool de conexiones a la DB:", error);
    process.exit(1);
}

//--- MIDDLEWARE DE AUTENTICACIÓN ADMIN ---
const checkAdmin = (req, res, next) => {
    const isAdminSimulated = req.headers['x-admin-simulated'] === 'true';
    if (isAdminSimulated) {
        console.log(`\t[Admin Check] Acceso Permitido para: ${req.method} ${req.path}`);
        next();
    } else {
        console.warn(`\t[Admin Check] Acceso DENEGADO a ruta admin ${req.method} ${req.path}. Falta/incorrecta cabecera x-admin-simulated.`);
        res.status(403).json({ success: false, message: 'Acceso prohibido. Se requieren permisos de administrador.' });
    }
};


// --- RUTAS DE AUTENTICACIÓN ---
app.post('/register', async (req, res) => {
    // ... (código sin cambios)
     try {
        const { username, email, password } = req.body;
        if (!username || !email || !password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Datos inválidos.' });
        }
        const [existingUser] = await dbPool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ success: false, message: 'Correo ya registrado.' });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const [result] = await dbPool.query('INSERT INTO usuarios (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, 'cliente']);
        console.log(`--> Usuario registrado: ${username} (ID: ${result.insertId})`);
        res.status(201).json({ success: true, message: 'Usuario registrado.' });
    } catch (error) {
        console.error('!!! Error en /register:', error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

app.post('/login', async (req, res) => {
    // ... (código sin cambios)
     try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Correo/Pass requeridos.' });
        }
        const [users] = await dbPool.query('SELECT id, username, email, password, role FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            console.log(`--> Login OK: ${user.username} (Rol: ${user.role})`);
            res.status(200).json({
                success: true,
                message: 'Login OK.',
                user: { id: user.id, username: user.username, email: user.email, role: user.role || 'cliente' }
            });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }
    } catch (error) {
        console.error('!!! Error en /login:', error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});


// --- RUTAS PÚBLICAS (PRODUCTOS, CONTACTO SIMULADO) ---
app.get('/api/productos', async (req, res) => {
    console.log("--> Solicitud GET /api/productos recibida");
    try {
        const [results] = await dbPool.query('SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url FROM producto');
        console.log(`\t<-- Devolviendo ${results.length} productos públicos`);
        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error GET /api/productos:', error);
        res.status(500).json({ success: false, message: 'Error obtener productos.' });
    }
});

app.get('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`--> Solicitud GET /api/productos/${id} recibida`);
    if (isNaN(id)) { return res.status(400).json({ success: false, message: 'ID inválido.' }); }
    try {
        const [results] = await dbPool.query('SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url FROM producto WHERE ID_Producto = ?', [id]);
        if (results.length === 0) {
             console.log(`\t<-- Producto ID ${id} no encontrado`);
             return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        console.log(`\t<-- Devolviendo detalles del producto ID ${id}`);
        res.status(200).json(results[0]);
    } catch (error) {
        console.error(`!!! Error GET /api/productos/${id}:`, error);
        res.status(500).json({ success: false, message: 'Error obtener producto.' });
    }
});

app.post('/api/contact', async (req, res) => {
    // ... (código sin cambios)
     try {
        const { name, email } = req.body;
        console.log(`--> Mensaje contacto RECIBIDO (Sim): De ${name} <${email}>`);
        res.status(200).json({ success: true, message: 'Mensaje recibido.' });
    } catch (error) {
        console.error("Error simulando contacto:", error);
        res.status(500).json({ success: false, message: "Error interno." });
    }
});


// --- RUTAS PAYPAL ---
app.post('/api/orders', async (req, res) => {
    // ... (código sin cambios, se asume correcto)
    try {
        const { productId } = req.body;
        console.log(`--> Solicitud POST /api/orders para producto ID: ${productId}`);
        if (!productId || isNaN(productId)) { return res.status(400).json({ success: false, message: "ID inválido." }); }
        let product;
        try {
            const [results] = await dbPool.query('SELECT ID_Producto, Nombre, precio_unitario FROM producto WHERE ID_Producto = ? LIMIT 1', [productId]);
            if (results.length === 0) { return res.status(404).json({ success: false, message: "P. no encontrado." }); }
            product = { id: results[0].ID_Producto, name: results[0].Nombre, price: parseFloat(results[0].precio_unitario) };
            if (isNaN(product.price) || product.price <= 0) { return res.status(400).json({ success: false, message: "Precio inválido." }); }
        } catch (dbError) {
            console.error(`!!! Error DB P${productId}:`, dbError);
            return res.status(500).json({ success: false, message: "Error consultando P." });
        }
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: 'USD', value: product.price.toFixed(2)}, description: `Compra ${product.name}` }]
        });
        console.log(`\tCreando orden PayPal P${productId}, $${product.price.toFixed(2)}`);
        const order = await client.execute(request);
        console.log(`\t<-- Orden PayPal CREADA: ${order.result.id}`);
        res.status(201).json({ id: order.result.id });
    } catch (err) {
        console.error("!!! Error CREAR orden PayPal:", err.message || err);
        if (err.statusCode) {
            const d=err.result?JSON.stringify(err.result):err.message;
            console.error(`PayPal Error ${err.statusCode}: ${d}`);
            return res.status(err.statusCode).json({ success: false, message: err.result?.message || "Error PayPal." });
        }
        res.status(500).json({ success: false, message: "Error interno." });
    }
});

app.post('/api/orders/:orderID/capture', async (req, res) => {
    // ... (código sin cambios, se asume correcto)
     try {
        const { orderID } = req.params;
        console.log(`--> Solicitud POST /api/orders/${orderID}/capture`);
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});
        console.log(`\tCapturando orden PayPal: ${orderID}`);
        const capture = await client.execute(request);
        const d = capture.result;
        console.log(`\t<-- Respuesta CAPTURA: ${orderID}, Estado: ${d.status}`);
        if (d.status !== 'COMPLETED') {
            console.warn(`\tCaptura NO COMPLETADA: ${d.status}`);
            return res.status(400).json({ success: false, message: `Estado: '${d.status}'.` });
        }
        console.log(`\tPago COMPLETADO: ${orderID}.`);
        const p = d.purchase_units?.[0]?.payments?.captures?.[0];
        if (p) { console.log(`\tCapture ID: ${p.id}, Monto: ${p.amount?.value} ${p.amount?.currency_code}`); }
        console.log(`\tTODO: Implementar lógica post-pago ${orderID}`);
        res.status(200).json({ success: true, capture: d });
    } catch (err) {
        console.error(`!!! Error CAPTURAR ${req.params.orderID}:`, err.message || err);
        if (err.statusCode) {
            const d=err.result?JSON.stringify(err.result):err.message;
            console.error(`PayPal Error ${err.statusCode}: ${d}`);
            const i = err.result?.details?.[0]?.issue;
            let m = err.result?.message || "Error PayPal.";
            let pe = i || 'UNKNOWN';
            if (i === 'INSTRUMENT_DECLINED') { m="Pago declinado."; pe='INSTRUMENT_DECLINED'; }
            else if (i === 'ORDER_ALREADY_CAPTURED') { m="Ya procesada."; pe='ORDER_ALREADY_CAPTURED'; }
            else if (i === 'ORDER_NOT_APPROVED') { m="No aprobada."; pe='ORDER_NOT_APPROVED'; }
            return res.status(err.statusCode).json({ success: false, message: m, paypal_error: pe });
        }
        res.status(500).json({ success: false, message: "Error interno." });
    }
});


// --- RUTAS DE ADMINISTRACIÓN ---

// GET Categorías
app.get('/api/categories', async (req, res) => {
    // ... (código sin cambios)
    try {
        console.log("--> GET /api/categories");
        const [results] = await dbPool.query('SELECT ID_Categoria, Nombre FROM categoria ORDER BY Nombre ASC');
        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error GET /api/categories:', error.message);
        res.status(500).json({ success: false, message: 'Error obtener categorías.' });
    }
});

// GET Productos Admin
app.get('/api/admin/products', checkAdmin, async (req, res) => {
    // console.log("--> GET /api/admin/products"); // Log en checkAdmin
    try {
        const [results] = await dbPool.query('SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url FROM producto ORDER BY ID_Producto ASC');
        console.log(`\t<-- Devolviendo ${results.length} productos para admin`);
        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error GET /api/admin/products:', error);
        res.status(500).json({ success: false, message: 'Error obtener productos admin.' });
    }
});

// GET Producto Individual Admin (para editar)
app.get('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    // console.log(`--> GET /api/admin/products/${id}`); // Log en checkAdmin
    if (isNaN(id)) { return res.status(400).json({ success: false, message: 'ID inválido.' }); }
    try {
        const [results] = await dbPool.query('SELECT * FROM producto WHERE ID_Producto = ?', [id]);
        if (results.length === 0) {
            console.log(`\t<-- Producto admin ID ${id} no encontrado`);
            return res.status(404).json({ success: false, message: 'P. no encontrado.' });
        }
         console.log(`\t<-- Devolviendo producto admin ID ${id} para editar`);
        res.status(200).json(results[0]);
    } catch (error) {
        console.error(`!!! Error GET /api/admin/products/${id}:`, error);
        res.status(500).json({ success: false, message: 'Error obtener P. para editar.' });
    }
});

// POST Añadir Producto
app.post('/api/admin/products', checkAdmin, async (req, res) => {
    // console.log("--> POST /api/admin/products"); // Log en checkAdmin
    try {
        const { Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url } = req.body;
        console.log("\tDatos recibidos para añadir:", req.body); // Log datos recibidos

        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) {
            console.warn("\tValidación fallida: Faltan datos requeridos");
            return res.status(400).json({ success: false, message: 'Faltan datos (*).' });
        }
        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        // Validaciones de tipo y rango
        if (isNaN(precioNum) || precioNum < 0) { console.warn("\tValidación fallida: Precio inválido"); return res.status(400).json({ success: false, message: 'Precio inválido.' }); }
        if (isNaN(cantidadNum) || cantidadNum < 0) { console.warn("\tValidación fallida: Cantidad inválida"); return res.status(400).json({ success: false, message: 'Cantidad inválida.' }); }
        if (ID_Categoria && isNaN(categoriaId)) { console.warn("\tValidación fallida: ID Categoría inválido"); return res.status(400).json({ success: false, message: 'ID Categoría inválido.' }); }

        const sql = `INSERT INTO producto (Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null, categoriaId, cantidadNum, imagen_url || null];
        console.log("\tEjecutando SQL INSERT:", sql, values);

        const [result] = await dbPool.query(sql, values);
        console.log(`\t<-- Producto añadido ID: ${result.insertId}`);
        res.status(201).json({ success: true, message: 'Producto añadido.', productId: result.insertId });
    } catch (error) {
        console.error('!!! Error POST /api/admin/products:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            console.warn("\tError: Código de barras duplicado");
            return res.status(409).json({ success: false, message: 'Error: Código barras duplicado.' });
        }
        res.status(500).json({ success: false, message: 'Error interno al añadir.' });
    }
});

// PUT para ACTUALIZAR un producto
app.put('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    // console.log(`--> PUT /api/admin/products/${id}`); // Log en checkAdmin
    if (isNaN(id)) { return res.status(400).json({ success: false, message: 'ID inválido.' }); }
    try {
        const { Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad, imagen_url } = req.body;
        console.log(`\tDatos recibidos para actualizar ID ${id}:`, req.body);

        if (!Nombre || precio_unitario === undefined || cantidad === undefined || !Marca) { console.warn("\tValidación fallida: Faltan datos requeridos"); return res.status(400).json({ success: false, message: 'Faltan datos (*).' }); }
        const precioNum = parseFloat(precio_unitario);
        const cantidadNum = parseInt(cantidad, 10);
        const categoriaId = ID_Categoria ? parseInt(ID_Categoria, 10) : null;

        if (isNaN(precioNum) || precioNum < 0) { console.warn("\tValidación fallida: Precio inválido"); return res.status(400).json({ success: false, message: 'Precio inválido.' }); }
        if (isNaN(cantidadNum) || cantidadNum < 0) { console.warn("\tValidación fallida: Cantidad inválida"); return res.status(400).json({ success: false, message: 'Cantidad inválida.' }); }
        if (ID_Categoria && isNaN(categoriaId)) { console.warn("\tValidación fallida: ID Categoría inválido"); return res.status(400).json({ success: false, message: 'ID Categoría inválido.' }); }

        const sql = `UPDATE producto SET Nombre = ?, Descripcion = ?, precio_unitario = ?, Marca = ?, Codigo_Barras = ?, ID_Categoria = ?, cantidad = ?, imagen_url = ? WHERE ID_Producto = ?`;
        const values = [Nombre, Descripcion || null, precioNum, Marca, Codigo_Barras || null, categoriaId, cantidadNum, imagen_url || null, id];
        console.log("\tEjecutando SQL UPDATE:", sql, values);

        const [result] = await dbPool.query(sql, values);
        if (result.affectedRows === 0) {
            console.log(`\t<-- Producto ID ${id} no encontrado para actualizar`);
            return res.status(404).json({ success: false, message: 'P. no encontrado para actualizar.' });
        }
        console.log(`\t<-- Producto actualizado ID: ${id}`);
        res.status(200).json({ success: true, message: 'Producto actualizado.' });
    } catch (error) {
        console.error(`!!! Error PUT /api/admin/products/${id}:`, error);
        if (error.code === 'ER_DUP_ENTRY') { console.warn("\tError: Código de barras duplicado"); return res.status(409).json({ success: false, message: 'Error: Cód. barras duplicado.' }); }
        res.status(500).json({ success: false, message: 'Error interno al actualizar.' });
    }
});

// DELETE para ELIMINAR un producto
app.delete('/api/admin/products/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    // console.log(`--> DELETE /api/admin/products/${id}`); // Log en checkAdmin
    if (isNaN(id)) { return res.status(400).json({ success: false, message: 'ID inválido.' }); }
    try {
        const sql = 'DELETE FROM producto WHERE ID_Producto = ?';
        console.log("\tEjecutando SQL DELETE:", sql, [id]);
        const [result] = await dbPool.query(sql, [id]);
        if (result.affectedRows === 0) {
            console.log(`\t<-- Producto ID ${id} no encontrado para eliminar`);
            return res.status(404).json({ success: false, message: 'P. no encontrado para eliminar.' });
        }
        console.log(`\t<-- Producto eliminado ID: ${id}`);
        res.status(200).json({ success: true, message: 'Producto eliminado.' });
    } catch (error) {
        console.error(`!!! Error DELETE /api/admin/products/${id}:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            console.warn(`\tError: Producto ID ${id} referenciado`);
            return res.status(409).json({ success: false, message: 'Error: Producto referenciado (ej. ventas).' });
        }
        res.status(500).json({ success: false, message: 'Error interno al eliminar.' });
    }
});


// --- RUTAS DE ADMINISTRACIÓN (CONFIGURACIÓN DEL SITIO) ---
app.get('/api/admin/settings', checkAdmin, (req, res) => {
    // console.log("--> GET /api/admin/settings"); // Log en checkAdmin
    console.log("\t<-- Devolviendo configuración del sitio (simulada)");
    res.status(200).json({ success: true, settings: siteSettings });
});

app.put('/api/admin/settings', checkAdmin, (req, res) => {
    const newSettings = req.body;
    // console.log("--> PUT /api/admin/settings con:", newSettings); // Log en checkAdmin
    const allowedKeys = ['colorPrimary', 'colorSecondary', 'colorAccent', 'welcomeTitle', 'promoBannerTitle', 'promoBannerText'];
    let updated = false;
    for (const key in newSettings) {
        if (allowedKeys.includes(key) && newSettings[key] !== undefined) {
            if (typeof newSettings[key] === 'string') {
                 if (key.startsWith('color') && !/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(newSettings[key])) {
                     console.warn(`\tIgnorando setting '${key}' por formato de color inválido: ${newSettings[key]}`);
                     continue;
                 }
                 siteSettings[key] = newSettings[key].trim();
                 updated = true;
                 console.log(`\tSetting '${key}' actualizado a: '${siteSettings[key]}'`);
            } else { console.warn(`\tIgnorando setting '${key}' por tipo inválido: ${typeof newSettings[key]}`); }
        } else { console.warn(`\tIgnorando setting no permitido o indefinido: '${key}'`); }
    }
    if (updated) {
        console.log("\t<-- Configuración del sitio actualizada (simulada).");
        res.status(200).json({ success: true, message: 'Configuración actualizada con éxito.', settings: siteSettings });
    } else {
        console.log("\t<-- No se realizaron cambios válidos en la configuración.");
        res.status(200).json({ success: true, message: 'No se proporcionaron datos válidos para actualizar o los valores eran los mismos.', settings: siteSettings });
    }
});


//--- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log("\n======================================================");
    console.log(`==> Servidor Ferremax escuchando en http://localhost:${PORT} [${isProduction ? 'PROD' : 'SANDBOX'}]`);
    console.log("======================================================");
});

// --- MANEJO DE CIERRE GRACEFUL ---
const gracefulShutdown = async (signal) => {
    // ... (código sin cambios)
    console.log(`\n==> Recibida señal ${signal}. Cerrando servidor...`);
    try {
        if (dbPool) {
            await dbPool.end();
            console.log('--> Pool de conexiones a la base de datos cerrado.');
        }
    } catch (err) {
        console.error('!!! Error al cerrar el pool de DB:', err);
    } finally {
        console.log("==> Servidor cerrado.");
        process.exit(0);
    }
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
