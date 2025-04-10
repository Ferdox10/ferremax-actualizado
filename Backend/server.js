// server.js - Servidor Backend Unificado para Ferremax con PayPal

// --- DEPENDENCIAS ---
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const paypal = require('@paypal/checkout-server-sdk');
// Nodemailer ya NO es necesario
require('dotenv').config(); // Carga variables de .env

// --- CONFIGURACIÓN ---
const app = express();
const PORT = process.env.PORT || 4000;
const saltRounds = 10;

// --- CONFIGURACIÓN PAYPAL ---
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Validar que las credenciales de PayPal estén cargadas desde .env
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error("\n!!! ERROR FATAL: Credenciales de PayPal (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) no definidas en el archivo .env\n");
    process.exit(1); // Terminar si faltan credenciales esenciales
}

let environment;
const isProduction = process.env.NODE_ENV === 'production';

// Configurar entorno de PayPal (Sandbox o Live) basado en NODE_ENV
if (isProduction) {
    console.log("--> Configurando PayPal en modo: Live (Producción)");
    environment = new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
} else {
    // Por defecto, o si NODE_ENV no es 'production', usar Sandbox
    console.log("--> Configurando PayPal en modo: Sandbox (Desarrollo/Pruebas)");
    environment = new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
}
let client = new paypal.core.PayPalHttpClient(environment);
// Mostrar últimos caracteres del Client ID para verificación (más seguro que mostrarlo completo)
console.log(`--> PayPal Client ID (Backend): ...${PAYPAL_CLIENT_ID.slice(-6)}`);


// --- CONFIGURACIÓN NODEMAILER (ELIMINADA) ---
// No se necesita configuración de Nodemailer ya que el envío está simulado


// --- MIDDLEWARE ---
app.use(cors()); // Habilitar CORS. Considera orígenes específicos en producción.
app.use(express.json()); // Para parsear body de peticiones como JSON
app.use(express.urlencoded({ extended: true })); // Para parsear body de formularios

// --- CONEXIÓN BASE DE DATOS ---
let dbPool;
try {
     // Crear pool de conexiones MySQL usando variables de entorno
     dbPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '', // Contraseña vacía por defecto
        database: process.env.DB_NAME || 'ferremax_db',
        waitForConnections: true, // Esperar si todas las conexiones están en uso
        connectionLimit: 10,    // Límite de conexiones simultáneas
        queueLimit: 0           // Sin límite en la cola de espera
    });

    // Probar conexión al iniciar para detectar problemas temprano
    dbPool.getConnection()
      .then(connection => {
          console.log(`--> Conexión exitosa a la base de datos '${connection.config.database}' en ${connection.config.host}`);
          connection.release(); // Liberar la conexión después de probarla
      })
      .catch(err => {
          // Loguear error pero no necesariamente terminar la aplicación si puede funcionar parcialmente sin DB
          console.error(`!!! Error de conexión a la base de datos (${err.code || 'N/A'}): ${err.message}`);
      });

} catch (error) {
    console.error("!!! Error CRÍTICO al crear el pool de conexiones a la DB:", error);
    process.exit(1); // Terminar la aplicación si no se puede crear el pool
}


// --- RUTAS DE AUTENTICACIÓN ---
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    // Validación básica de entrada
    if (!username || !email || !password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Datos de registro inválidos o faltantes.' });
    }
    try {
        // Verificar si el correo ya existe
        const [existingUser] = await dbPool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' }); // 409 Conflict
        }
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // Insertar el nuevo usuario
        const [result] = await dbPool.query('INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        console.log(`--> Usuario registrado: ${username} (ID: ${result.insertId})`);
        res.status(201).json({ success: true, message: 'Usuario registrado con éxito.' }); // 201 Created
    } catch (error) {
        console.error('!!! Error en /register:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al registrar el usuario.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Correo electrónico y contraseña son requeridos.' });
    }
    try {
        // Buscar usuario por email
        const [users] = await dbPool.query('SELECT id, username, email, password FROM usuarios WHERE email = ? LIMIT 1', [email]);
        if (users.length === 0) {
            // Usuario no encontrado (mensaje genérico por seguridad)
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' }); // 401 Unauthorized
        }
        const user = users[0];
        // Comparar la contraseña proporcionada con la almacenada (hasheada)
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Contraseña correcta
            console.log(`--> Login exitoso: ${user.username}`);
            // En una aplicación real, aquí se generaría y enviaría un token JWT
            res.status(200).json({
                success: true,
                message: 'Inicio de sesión exitoso.',
                // Devolver datos básicos del usuario (sin la contraseña)
                user: { id: user.id, username: user.username, email: user.email }
            });
        } else {
            // Contraseña incorrecta
            res.status(401).json({ success: false, message: 'Credenciales incorrectas.' }); // 401 Unauthorized
        }
    } catch (error) {
        console.error('!!! Error en /login:', error);
        res.status(500).json({ success: false, message: 'Error interno durante el inicio de sesión.' });
    }
});

// --- RUTAS DE PRODUCTOS ---
app.get('/api/productos', async (req, res) => {
    try {
        // Seleccionar columnas relevantes para el frontend
        const [results] = await dbPool.query('SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad FROM producto');
        res.status(200).json(results);
    } catch (error) {
        console.error('!!! Error en GET /api/productos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener la lista de productos.' });
    }
});

app.get('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    // Validar que el ID sea numérico
    if (isNaN(id)) {
         return res.status(400).json({ success: false, message: 'ID de producto inválido.' });
    }
    try {
        const [results] = await dbPool.query('SELECT ID_Producto, Nombre, Descripcion, precio_unitario, Marca, Codigo_Barras, ID_Categoria, cantidad FROM producto WHERE ID_Producto = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' }); // 404 Not Found
        }
        res.status(200).json(results[0]); // Devolver el producto encontrado
    } catch (error) {
        console.error(`!!! Error en GET /api/productos/${id}:`, error);
        res.status(500).json({ success: false, message: 'Error al obtener los detalles del producto.' });
    }
});

// --- RUTA DE CONTACTO (SIMULADA) ---
app.post('/api/contact', async (req, res) => {
    // Obtener los datos del formulario del cuerpo de la solicitud
    const { name, email, subject, message } = req.body;

    // Validación simple (opcional, ya que no se procesará realmente)
    if (!name || !email || !subject || !message) {
        console.warn("--> /api/contact: Recibida solicitud de contacto incompleta.");
        // Podrías devolver un error 400 si quisieras ser estricto
        // return res.status(400).json({ success: false, message: 'Faltan campos en el mensaje.' });
    }

    // Registrar en la consola del servidor que se recibió la solicitud (para depuración)
    console.log(`--> Mensaje de contacto RECIBIDO (Simulación): De ${name} <${email}> Asunto: ${subject}`);

    // Devolver inmediatamente una respuesta de éxito al frontend
    // Esto hará que el frontend muestre el mensaje de "Mensaje enviado con éxito"
    res.status(200).json({ success: true, message: 'Mensaje recibido con éxito.' });
});


// --- RUTAS PAYPAL (Con logging mejorado) ---
app.post('/api/orders', async (req, res) => {
    const { productId } = req.body;
    // Validar productId
    if (!productId || isNaN(productId)) {
        return res.status(400).json({ success: false, message: "ID de producto inválido." });
    }

    let product;
    try {
        // Obtener detalles del producto desde la DB
        const [results] = await dbPool.query('SELECT ID_Producto, Nombre, precio_unitario FROM producto WHERE ID_Producto = ? LIMIT 1', [productId]);
        if (results.length === 0) {
             return res.status(404).json({ success: false, message: "Producto no encontrado." });
        }
        product = {
            id: results[0].ID_Producto,
            name: results[0].Nombre,
            price: parseFloat(results[0].precio_unitario)
        };
        // Validar precio
        if (isNaN(product.price) || product.price <= 0) {
             console.error(`!!! Precio inválido para producto ID ${productId}: ${results[0].precio_unitario}`);
             return res.status(400).json({ success: false, message: "Precio del producto inválido." });
        }
    } catch (dbError) {
        console.error(`!!! Error DB buscando producto ID ${productId}:`, dbError);
        return res.status(500).json({ success: false, message: "Error interno al consultar el producto." });
    }

    // Crear solicitud para PayPal
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation"); // Pedir detalles de la orden creada
    request.requestBody({
        intent: 'CAPTURE', // Capturar pago inmediatamente
        purchase_units: [{
            amount: {
                currency_code: 'USD', // Moneda (¡Asegúrate que tu cuenta PayPal la soporte!)
                value: product.price.toFixed(2), // Precio formateado
            },
            description: `Compra de ${product.name} (ID: ${product.id})`, // Descripción para el cliente
            // custom_id: `FERREMAX-${productId}-${Date.now()}` // ID personalizado opcional para rastreo
        }]
    });

    try {
        // Ejecutar la creación de la orden en PayPal
        console.log(`--> Creando orden PayPal para producto ID: ${productId}, Precio: ${product.price.toFixed(2)} USD`);
        const order = await client.execute(request);
        console.log(`--> Orden PayPal CREADA con ID: ${order.result.id}, Estado: ${order.result.status}`);
        // Enviar ID de la orden al frontend
        res.status(201).json({ id: order.result.id });

    } catch (err) {
        // Manejo de errores de creación de orden
        console.error("!!! Error al CREAR orden PayPal:", err.message || err);
        if (err.statusCode) {
             const errorDetails = err.result ? JSON.stringify(err.result, null, 2) : err.message;
             console.error(`PayPal Error Details (Create Order - Status ${err.statusCode}):\n`, errorDetails);
             // Devolver mensaje de error de PayPal si está disponible
             return res.status(err.statusCode).json({ success: false, message: err.result?.message || "Error de PayPal al crear la orden." });
        }
        // Error genérico del servidor
        res.status(500).json({ success: false, message: "Error interno del servidor al iniciar el proceso de pago." });
    }
});

app.post('/api/orders/:orderID/capture', async (req, res) => {
    const { orderID } = req.params; // Obtener ID de la orden desde la URL
    console.log(`--> Intentando CAPTURAR pago para orden PayPal ID: ${orderID}`);
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({}); // Cuerpo vacío necesario para capturar

    try {
        // Ejecutar la captura del pago en PayPal
        const capture = await client.execute(request);
        const captureDetails = capture.result;
        console.log(`--> Respuesta de CAPTURA para orden ID: ${orderID}, Estado: ${captureDetails.status}`);
        // console.log("Detalles completos de la captura:", JSON.stringify(captureDetails, null, 2)); // Descomentar para debug

        // Verificar que la captura esté COMPLETED
        if (captureDetails.status !== 'COMPLETED') {
             console.warn(`--> Estado de captura NO COMPLETADO: ${captureDetails.status} para orden ${orderID}`);
             // Devolver error indicando el estado real
             return res.status(400).json({ success: false, message: `El estado del pago es '${captureDetails.status}'. No se completó la orden.` });
        }

        // Éxito en la captura
        console.log(`--> Pago COMPLETADO exitosamente para orden ${orderID}.`);
        const paymentCapture = captureDetails.purchase_units?.[0]?.payments?.captures?.[0];
        if (paymentCapture) {
             console.log(`--> Capture ID: ${paymentCapture.id}, Monto: ${paymentCapture.amount?.value} ${paymentCapture.amount?.currency_code}`);
        }

        // --- ACCIONES POST-PAGO ---
        // Aquí va tu lógica de negocio: guardar en DB, actualizar stock, enviar email de confirmación (si lo reactivas), etc.
        console.log(`--> TODO: Implementar lógica post-pago para la orden ${orderID} (guardar en DB, stock, etc.)`);
        // Ejemplo:
        // await saveOrderToDatabase(captureDetails, product.id); // Necesitarías tener productId aquí
        // await decreaseStock(product.id, 1);

        // Enviar respuesta de éxito al frontend
        res.status(200).json({ success: true, capture: captureDetails });

    } catch (err) {
        // Manejo de errores de captura de orden
        console.error(`!!! Error al CAPTURAR orden PayPal ID ${orderID}:`, err.message || err);
        if (err.statusCode) {
             const errorDetails = err.result ? JSON.stringify(err.result, null, 2) : err.message;
             console.error(`PayPal Error Details (Capture Order - Status ${err.statusCode}):\n`, errorDetails);
             // Identificar errores comunes de PayPal y dar mensajes más claros
             const issue = err.result?.details?.[0]?.issue;
             let userMessage = err.result?.message || "Error de PayPal al procesar el pago.";
             let paypalError = issue || 'UNKNOWN_CAPTURE_ERROR';

             if (issue === 'INSTRUMENT_DECLINED') {
                  userMessage = "Pago declinado por el método de pago.";
                  paypalError = 'INSTRUMENT_DECLINED';
             } else if (issue === 'ORDER_ALREADY_CAPTURED') {
                  userMessage = "Esta orden ya ha sido procesada anteriormente.";
                  paypalError = 'ORDER_ALREADY_CAPTURED';
             } else if (issue === 'ORDER_NOT_APPROVED') {
                   userMessage = "La orden no ha sido aprobada por el comprador.";
                   paypalError = 'ORDER_NOT_APPROVED';
             }
             // Devolver el error al frontend
             return res.status(err.statusCode).json({ success: false, message: userMessage, paypal_error: paypalError });
        }
        // Error interno genérico del servidor
        res.status(500).json({ success: false, message: "Error interno del servidor al procesar el pago." });
    }
});


// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log("-------------------------------------------");
    console.log(`==> Servidor Ferremax escuchando en http://localhost:${PORT}`);
    console.log(`--> Entorno: ${isProduction ? 'Producción' : 'Desarrollo/Sandbox'}`);
    // Indicar que el envío de correos está simulado
    console.log("--> Envío de correos de contacto: SIMULADO (Deshabilitado)");
    console.log("-------------------------------------------");
});

// --- MANEJO DE CIERRE GRACEFUL ---
// Función para cerrar conexiones limpiamente antes de salir
const gracefulShutdown = async (signal) => {
    console.log(`\n==> Recibida señal ${signal}. Cerrando servidor...`);
    // Aquí podrías cerrar el servidor HTTP si lo asignaste a una variable: server.close(() => {...});
    try {
        if (dbPool) {
            await dbPool.end(); // Cerrar pool de conexiones a la base de datos
            console.log('--> Pool de conexiones a la base de datos cerrado.');
        }
    } catch (err) {
        console.error('!!! Error al cerrar el pool de DB:', err);
    } finally {
        console.log("==> Servidor cerrado.");
        process.exit(0); // Salir del proceso
    }
};
// Escuchar señales de terminación comunes
process.on('SIGINT', gracefulShutdown); // Captura Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Captura señales de terminación (ej. Docker stop)
