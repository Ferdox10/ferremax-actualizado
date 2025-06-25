// backend/services/siteSettings.js
const { getPool } = require('../config/database');

let siteSettings = {};
const defaultSettings = {
    colorPrimary: '#ea580c', colorSecondary: '#047857', colorAccent: '#f1f5f9',
    welcomeTitle: 'Bienvenido a Ferremax', promoBannerTitle: '¡Ofertas Imperdibles!',
    promoBannerText: 'Descuentos especiales en herramientas seleccionadas.',
    contactAddress: 'Calle Falsa 123, Barranquilla, Colombia', contactPhone: '+57 300 123 4567',
    contactEmail: 'info@ferremax.example.com', socialFacebook: '', socialTwitter: '',
    socialInstagram: '', socialYoutube: ''
};

async function loadSiteSettings() {
    console.log("--> Cargando siteSettings desde la base de datos...");
    const dbPool = getPool();
    try {
        const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM site_settings');
        rows.forEach(row => {
            siteSettings[row.setting_key] = row.setting_value;
        });

        let updatedDefaultsInDB = false;
        for (const key in defaultSettings) {
            if (siteSettings[key] === undefined) {
                siteSettings[key] = defaultSettings[key];
                await dbPool.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, defaultSettings[key], defaultSettings[key]]);
                updatedDefaultsInDB = true;
            }
        }
        if (updatedDefaultsInDB) console.log("--> Settings por defecto guardados en BD.");
        console.log("--> Configuración del sitio cargada/aplicada.");

    } catch (error) {
        console.error("!!! Error CRÍTICO al cargar siteSettings. Usando defaults en memoria:", error);
        siteSettings = { ...defaultSettings };
    }
}

function getSiteSettings() {
    return siteSettings;
}

function updateSiteSettings(newSettings) {
    siteSettings = { ...siteSettings, ...newSettings };
    return siteSettings;
}

module.exports = {
    loadSiteSettings,
    getSiteSettings,
    updateSiteSettings
};