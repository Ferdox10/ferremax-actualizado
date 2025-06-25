// backend/controllers/admin/settingsController.js
// Controlador para configuración del sitio (colores, textos, etc.)
const { getPool } = require('../../config/database');

// Obtener configuración del sitio
const getSettings = async (req, res) => {
    const dbPool = getPool();
    try {
        const [settings] = await dbPool.query('SELECT setting_key, setting_value FROM site_settings');
        const settingsObj = {};
        settings.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
        res.status(200).json({ success: true, settings: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la configuración del sitio.' });
    }
};

// Actualizar configuración del sitio
const updateSettings = async (req, res) => {
    const dbPool = getPool();
    const newSettings = req.body;
    const allowed = [
        'colorPrimary','colorSecondary','colorAccent','welcomeTitle','promoBannerTitle','promoBannerText',
        'contactAddress','contactPhone','contactEmail','socialFacebook','socialTwitter','socialInstagram','socialYoutube'
    ];
    let ops = [], changed = false;
    try {
        for (const k in newSettings) {
            if (allowed.includes(k) && newSettings[k] !== undefined) {
                const val = typeof newSettings[k] === 'string' ? newSettings[k].trim() : newSettings[k];
                const finalVal = (val === null || val === undefined) ? '' : val;
                ops.push(dbPool.query(
                    'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?',
                    [k, finalVal, finalVal]
                ));
                changed = true;
            }
        }
        if (ops.length > 0) {
            await Promise.all(ops);
            res.status(200).json({ success: true, message: 'Configuración actualizada.' });
        } else if (changed) {
            res.status(200).json({ success: true, message: 'Configuración actualizada (sin cambios BD).' });
        } else {
            res.status(200).json({ success: true, message: 'No se proporcionaron datos válidos para actualizar.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar la configuración.' });
    }
};

module.exports = { getSettings, updateSettings };
