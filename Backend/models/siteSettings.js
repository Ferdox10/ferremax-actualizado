const dbPool = require('../config/database');

let siteSettings = {};

async function loadSiteSettingsFromDB() {
    try {
        const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM site_settings');
        rows.forEach(row => {
            siteSettings[row.setting_key] = row.setting_value;
        });
        // Defaults
        const defaultSettings = {
            colorPrimary: '#ea580c', colorSecondary: '#047857', colorAccent: '#f1f5f9',
            welcomeTitle: 'Bienvenido a Ferremax', promoBannerTitle: '¡Ofertas Imperdibles de Temporada!',
            promoBannerText: 'Encuentra descuentos especiales en herramientas seleccionadas. ¡No te lo pierdas!',
            contactAddress: 'Calle Falsa 123, Barranquilla, Colombia', contactPhone: '+57 300 123 4567',
            contactEmail: 'info@ferremax.example.com', socialFacebook: '', socialTwitter: '',
            socialInstagram: '', socialYoutube: ''
        };
        for (const key in defaultSettings) {
            if (siteSettings[key] === undefined) {
                siteSettings[key] = defaultSettings[key];
                await dbPool.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, defaultSettings[key], defaultSettings[key]]);
            }
        }
    } catch (error) {
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

module.exports = { siteSettings, loadSiteSettingsFromDB };
