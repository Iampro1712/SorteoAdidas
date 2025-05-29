/**
 * Google Sheets API Integration
 * Configuración para conectar con Google Sheets como base de datos gratuita
 */

class SheetsAPI {
    constructor() {
        // Configuración de Google Sheets API desde variables de entorno
        this.SHEET_ID = null;
        this.API_KEY = null;
        this.RANGE = 'A:F'; // Rango de datos en la primera hoja

        // URLs de la API (se configuran después de cargar las variables)
        this.READ_URL = null;
        this.WRITE_URL = null;

        // Cache local para optimizar rendimiento
        this.cache = {
            data: null,
            lastUpdate: null,
            ttl: 30000 // 30 segundos de cache
        };

        // Estado de los números
        this.numbersState = new Map();

        this.init();
    }

    async init() {
        try {
            // Cargar configuración desde variables de entorno o localStorage
            await this.loadConfig();

            if (this.SHEET_ID && this.API_KEY) {
                await this.loadNumbers();
                console.log('✅ Sheets API inicializada correctamente');
            } else {
                console.warn('⚠️ Configuración de Sheets no encontrada, usando datos locales');
                this.initLocalData();
            }
        } catch (error) {
            console.warn('⚠️ Error al inicializar Sheets API, usando datos locales:', error);
            this.initLocalData();
        }
    }

    /**
     * Carga la configuración desde variables de entorno o localStorage
     */
    async loadConfig() {
        // Intentar cargar desde variables de entorno de Netlify
        try {
            // En Netlify, las variables de entorno están disponibles en tiempo de build
            // Para el frontend, necesitamos usar una función serverless o configuración
            const response = await fetch('/.netlify/functions/get-config');
            if (response.ok) {
                const config = await response.json();
                this.SHEET_ID = config.SHEET_ID;
                this.API_KEY = config.API_KEY;
            }
        } catch (error) {
            console.log('No se pudo cargar config desde función serverless, usando localStorage');
        }

        // Fallback a localStorage (configuración manual desde admin)
        if (!this.SHEET_ID || !this.API_KEY) {
            this.SHEET_ID = localStorage.getItem('sorteo-sheet-id');
            this.API_KEY = localStorage.getItem('sorteo-api-key');
        }

        // Configurar URLs si tenemos las credenciales
        if (this.SHEET_ID && this.API_KEY) {
            this.READ_URL = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.RANGE}?key=${this.API_KEY}`;
            this.WRITE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.RANGE}:append?valueInputOption=RAW&key=${this.API_KEY}`;
        }
    }

    /**
     * Inicializa datos locales si no hay conexión con Sheets
     */
    initLocalData() {
        // Crear 99 números disponibles
        for (let i = 1; i <= 99; i++) {
            const number = i.toString().padStart(3, '0');
            this.numbersState.set(number, {
                number: number,
                status: 'available', // available, sold, reserved
                buyer: null,
                phone: null,
                email: null,
                timestamp: null
            });
        }

        // Simular algunos números vendidos para demo
        this.numbersState.set('001', {
            number: '001',
            status: 'sold',
            buyer: 'Juan Pérez',
            phone: '+505 8888-1111',
            email: 'juan@email.com',
            timestamp: new Date().toISOString()
        });

        this.numbersState.set('025', {
            number: '025',
            status: 'sold',
            buyer: 'María García',
            phone: '+505 8888-2222',
            email: 'maria@email.com',
            timestamp: new Date().toISOString()
        });

        console.log('📱 Datos locales inicializados');
    }

    /**
     * Carga números desde Google Sheets
     */
    async loadNumbers() {
        // Verificar cache
        if (this.isCacheValid()) {
            return this.cache.data;
        }

        try {
            console.log('🔗 Intentando conectar con:', this.READ_URL);
            const response = await fetch(this.READ_URL);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Datos recibidos de Sheets:', data);

            // Procesar datos de la hoja
            this.processSheetData(data.values || []);

            // Actualizar cache
            this.cache.data = data.values;
            this.cache.lastUpdate = Date.now();

            return data.values;

        } catch (error) {
            console.error('Error al cargar desde Sheets:', error);
            throw error;
        }
    }

    /**
     * Procesa los datos de Google Sheets
     */
    processSheetData(rows) {
        this.numbersState.clear();

        // Inicializar todos los números como disponibles
        for (let i = 1; i <= 99; i++) {
            const number = i.toString().padStart(3, '0');
            this.numbersState.set(number, {
                number: number,
                status: 'available',
                buyer: null,
                phone: null,
                email: null,
                timestamp: null
            });
        }

        // Procesar datos de la hoja (saltar header si existe)
        const dataRows = rows.slice(1); // Asume que la primera fila es header

        dataRows.forEach(row => {
            if (row.length >= 2) {
                const [number, status, buyer, phone, email, timestamp] = row;

                if (number && this.numbersState.has(number)) {
                    this.numbersState.set(number, {
                        number: number,
                        status: status || 'available',
                        buyer: buyer || null,
                        phone: phone || null,
                        email: email || null,
                        timestamp: timestamp || null
                    });
                }
            }
        });
    }

    /**
     * Verifica si el cache es válido
     */
    isCacheValid() {
        return this.cache.data &&
               this.cache.lastUpdate &&
               (Date.now() - this.cache.lastUpdate) < this.cache.ttl;
    }

    /**
     * Obtiene el estado de todos los números
     */
    getNumbersState() {
        return this.numbersState;
    }

    /**
     * Obtiene el estado de un número específico
     */
    getNumberState(number) {
        return this.numbersState.get(number);
    }

    /**
     * Reserva números temporalmente
     */
    reserveNumbers(numbers, duration = 900000) { // 15 minutos por defecto
        const reservedNumbers = [];

        numbers.forEach(number => {
            const state = this.numbersState.get(number);
            if (state && state.status === 'available') {
                state.status = 'reserved';
                state.reservedUntil = Date.now() + duration;
                reservedNumbers.push(number);
            }
        });

        // Auto-liberar después del tiempo especificado
        setTimeout(() => {
            this.releaseReservedNumbers(reservedNumbers);
        }, duration);

        return reservedNumbers;
    }

    /**
     * Libera números reservados
     */
    releaseReservedNumbers(numbers) {
        numbers.forEach(number => {
            const state = this.numbersState.get(number);
            if (state && state.status === 'reserved') {
                state.status = 'available';
                delete state.reservedUntil;
            }
        });
    }

    /**
     * Marca números como vendidos
     */
    async sellNumbers(numbers, buyerInfo) {
        try {
            const soldNumbers = [];

            // Actualizar estado local
            numbers.forEach(number => {
                const state = this.numbersState.get(number);
                if (state && (state.status === 'available' || state.status === 'reserved')) {
                    state.status = 'sold';
                    state.buyer = buyerInfo.nombre;
                    state.phone = buyerInfo.telefono;
                    state.email = buyerInfo.email;
                    state.timestamp = new Date().toISOString();
                    soldNumbers.push(number);
                }
            });

            // Intentar sincronizar con Google Sheets
            try {
                await this.syncToSheets(soldNumbers, buyerInfo);
            } catch (error) {
                console.warn('No se pudo sincronizar con Sheets, datos guardados localmente:', error);
            }

            return soldNumbers;

        } catch (error) {
            console.error('Error al vender números:', error);
            throw error;
        }
    }

    /**
     * Sincroniza datos con Google Sheets
     */
    async syncToSheets(numbers, buyerInfo) {
        const rows = numbers.map(number => [
            number,
            'sold',
            buyerInfo.nombre,
            buyerInfo.telefono,
            buyerInfo.email || '',
            new Date().toISOString()
        ]);

        const requestBody = {
            values: rows
        };

        const response = await fetch(this.WRITE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Error al escribir en Sheets: ${response.status}`);
        }

        // Invalidar cache
        this.cache.data = null;
        this.cache.lastUpdate = null;

        return await response.json();
    }

    /**
     * Obtiene estadísticas del sorteo
     */
    getStats() {
        let available = 0;
        let sold = 0;
        let reserved = 0;

        this.numbersState.forEach(state => {
            switch (state.status) {
                case 'available':
                    available++;
                    break;
                case 'sold':
                    sold++;
                    break;
                case 'reserved':
                    reserved++;
                    break;
            }
        });

        return {
            total: 99,
            available,
            sold,
            reserved,
            percentage: Math.round((sold / 99) * 100)
        };
    }

    /**
     * Refresca datos desde Google Sheets
     */
    async refresh() {
        this.cache.data = null;
        this.cache.lastUpdate = null;
        return await this.loadNumbers();
    }
}

// Instancia global
window.sheetsAPI = new SheetsAPI();
