# Lista de tareas/pending para la estructura de Backend

Esta lista contiene los archivos y carpetas que se deben crear o refactorizar según la estructura propuesta. Marca los archivos creados con [x] y los pendientes con [ ]:

## Estructura deseada

- [x] config/
  - [x] database.js # Configuración y conexión de la base de datos (MySQL)
  - [x] mailer.js # Configuración de Nodemailer
  - [x] payment.js # Configuración de Wompi, PayPal y otras pasarelas
  - [x] ai.js # Configuración del SDK de Gemini AI
- [x] controllers/
  - [x] admin/
    - [x] analyticsController.js
    - [x] contentController.js
    - [x] messageController.js
    - [x] orderController.js
    - [x] productController.js
    - [x] userController.js
  - [x] authController.js # Lógica para login y registro
  - [x] orderController.js # Lógica para pedidos (Wompi, ContraEntrega, PayPal)
  - [x] productController.js # Lógica para productos públicos y reseñas
  - [x] publicController.js # Lógica para contacto, contenido público (FAQ, políticas)
  - [x] aiController.js # Lógica para el asistente de IA
- [x] middleware/
  - [x] authMiddleware.js # Funciones checkAdmin y checkUser
- [x] models/ (o services/)
  - [x] siteSettings.js # Lógica para cargar y gestionar la configuración del sitio
  - [x] client.js # Helper para getOrCreateClienteId
- [x] routes/
  - [x] admin.js # Agrupa todas las rutas de administración
  - [x] auth.js # Rutas de /register y /login
  - [x] orders.js # Rutas para crear pedidos y webhooks de pago
  - [x] products.js # Rutas públicas de productos, categorías, reseñas
  - [x] public.js # Rutas de contacto, contenido, etc.
  - [x] index.js # El enrutador principal que une todo
- [ ] .env # Tus variables de entorno (¡NO SUBIR A GIT!)
- [ ] .env.example # Ejemplo de las variables que se necesitan
- [ ] package.json
- [ ] server.js # ¡AHORA MUCHO MÁS CORTO Y LIMPIO!

> Cuando pidas crear un archivo, se marcará aquí como realizado.
