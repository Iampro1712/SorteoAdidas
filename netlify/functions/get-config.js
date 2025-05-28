/**
 * Función serverless de Netlify para obtener configuración
 * Maneja las variables de entorno de forma segura
 */

exports.handler = async (event, context) => {
    // Headers CORS para permitir requests desde el frontend
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Solo permitir GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Obtener variables de entorno
        const config = {
            SHEET_ID: process.env.GOOGLE_SHEET_ID,
            API_KEY: process.env.GOOGLE_API_KEY,
            ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123'
        };

        // Verificar que las variables existan
        if (!config.SHEET_ID || !config.API_KEY) {
            console.warn('Variables de entorno no configuradas correctamente');
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Configuration not found',
                    message: 'Please configure environment variables in Netlify'
                })
            };
        }

        // Retornar configuración
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(config)
        };

    } catch (error) {
        console.error('Error al obtener configuración:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'Failed to load configuration'
            })
        };
    }
};
