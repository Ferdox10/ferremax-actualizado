const nodemailer = require('nodemailer');

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

module.exports = transporter;
