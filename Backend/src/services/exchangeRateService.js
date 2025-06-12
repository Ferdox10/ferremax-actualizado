const axios = require('axios');

const getExchangeRate = async () => {
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    if (!apiKey) {
        return { success: false, message: 'Servicio de conversión no configurado en el servidor.', fallbackRate: 4000 };
    }
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    try {
        const response = await axios.get(apiUrl);
        if (response.data && response.data.result === 'success') {
            const rateCOP = response.data.conversion_rates.COP;
            if (!rateCOP) throw new Error('La moneda COP no fue encontrada en la respuesta de la API externa.');
            return { success: true, rate: rateCOP };
        } else {
            throw new Error(`La API de tasa de cambio respondió con un error: ${response.data['error-type']}`);
        }
    } catch (error) {
        return { success: false, message: 'No se pudo obtener la tasa en tiempo real.', fallbackRate: 4000 };
    }
};

module.exports = { getExchangeRate };
