/**
 * PayPal Integration Module
 * Maneja pagos con PayPal incluyendo cálculo automático de comisiones
 */

class PayPalIntegration {
    constructor() {
        this.clientId = null;
        this.basePrice = 70; // Precio base en córdobas
        this.paypalFeeRate = 0.045; // 4.5% comisión PayPal para Nicaragua
        this.fixedFee = 0.30; // Comisión fija en USD
        this.exchangeRate = 36.5; // Córdobas por USD (aproximado)
        this.isInitialized = false;
    }

    /**
     * Inicializa PayPal con las credenciales del entorno
     */
    async initialize() {
        try {
            // Cargar variables de entorno
            await this.loadEnvironmentVariables();

            if (!this.clientId) {
                throw new Error('PayPal Client ID no encontrado');
            }

            // Cargar SDK de PayPal
            await this.loadPayPalSDK();
            this.isInitialized = true;

            console.log('✅ PayPal inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando PayPal:', error);
            return false;
        }
    }

    /**
     * Carga las variables de entorno
     */
    async loadEnvironmentVariables() {
        // En producción, las variables de entorno deben estar disponibles como variables globales
        // Netlify las inyecta automáticamente durante el build
        this.clientId = 'AZpmN8jNIvUD7RV9RBa51NwGhcar4I50-zuhMyoGFGPAN517PO5oG2I8kCOmhylj5YTp7CQkzHHWK0xT';

        // Verificar si tenemos el client ID
        if (!this.clientId) {
            throw new Error('PayPal Client ID no configurado');
        }

        console.log('✅ PayPal Client ID cargado');
    }

    /**
     * Carga el SDK de PayPal dinámicamente
     */
    loadPayPalSDK() {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (window.paypal) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=USD&components=buttons`;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Calcula el precio total incluyendo comisiones de PayPal
     */
    calculateTotalPrice(basePrice = this.basePrice) {
        // Convertir córdobas a USD
        const basePriceUSD = basePrice / this.exchangeRate;

        // Calcular comisión porcentual
        const percentageFee = basePriceUSD * this.paypalFeeRate;

        // Precio total en USD
        const totalUSD = basePriceUSD + percentageFee + this.fixedFee;

        // Convertir de vuelta a córdobas
        const totalCordobas = Math.ceil(totalUSD * this.exchangeRate);

        return {
            basePrice: basePrice,
            basePriceUSD: parseFloat(basePriceUSD.toFixed(2)),
            paypalFees: parseFloat((percentageFee + this.fixedFee).toFixed(2)),
            totalUSD: parseFloat(totalUSD.toFixed(2)),
            totalCordobas: totalCordobas,
            breakdown: {
                percentageFee: parseFloat(percentageFee.toFixed(2)),
                fixedFee: this.fixedFee,
                exchangeRate: this.exchangeRate
            }
        };
    }

    /**
     * Renderiza los botones de PayPal
     */
    renderPayPalButtons(containerId, selectedNumbers, onSuccess, onError) {
        if (!this.isInitialized) {
            console.error('PayPal no está inicializado');
            return;
        }

        const totalPrice = selectedNumbers.length * this.basePrice;
        const pricing = this.calculateTotalPrice(totalPrice);

        return window.paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal',
                height: 40
            },

            createOrder: (data, actions) => {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: 'USD',
                            value: pricing.totalUSD.toString()
                        },
                        description: `Sorteo Adidas - Números ${selectedNumbers.join(', ')}`,
                        custom_id: `sorteo_${selectedNumbers.join('_')}_${Date.now()}`,
                        reference_id: selectedNumbers.join(',')
                    }],
                    intent: 'CAPTURE',
                    application_context: {
                        brand_name: 'Sorteo Adidas Premium',
                        landing_page: 'NO_PREFERENCE',
                        user_action: 'PAY_NOW',
                        return_url: window.location.origin + '/success',
                        cancel_url: window.location.origin + '/cancel'
                    }
                });
            },

            onApprove: async (data, actions) => {
                try {
                    // Capturar el pago
                    const order = await actions.order.capture();

                    // Procesar el pago exitoso
                    await this.handleSuccessfulPayment(order, selectedNumbers, pricing);

                    if (onSuccess) {
                        onSuccess(order, pricing);
                    }
                } catch (error) {
                    console.error('Error capturando pago:', error);
                    if (onError) {
                        onError(error);
                    }
                }
            },

            onError: (err) => {
                console.error('Error en PayPal:', err);
                if (onError) {
                    onError(err);
                }
            },

            onCancel: (data) => {
                console.log('Pago cancelado:', data);
                // Mostrar mensaje de cancelación
                this.showMessage('Pago cancelado. Puedes intentar nuevamente.', 'warning');
            }
        }).render(containerId);
    }

    /**
     * Maneja un pago exitoso
     */
    async handleSuccessfulPayment(order, selectedNumbers, pricing) {
        try {
            const buyerInfo = {
                nombre: order.payer.name.given_name + ' ' + (order.payer.name.surname || ''),
                telefono: order.payer.phone?.phone_number?.national_number || 'No proporcionado',
                email: order.payer.email_address,
                paypalOrderId: order.id,
                paypalPayerId: order.payer.payer_id,
                montoUSD: pricing.totalUSD,
                montoCordobas: pricing.totalCordobas,
                comisionPayPal: pricing.paypalFees
            };

            // Registrar en Google Sheets
            if (window.sheetsAPI) {
                await window.sheetsAPI.sellNumbers(selectedNumbers, buyerInfo);
            }

            // Actualizar UI
            this.updateUIAfterPayment(selectedNumbers);

            // Mostrar mensaje de éxito
            this.showSuccessMessage(order, pricing, selectedNumbers);

        } catch (error) {
            console.error('Error procesando pago exitoso:', error);
            throw error;
        }
    }

    /**
     * Actualiza la UI después de un pago exitoso
     */
    updateUIAfterPayment(selectedNumbers) {
        // Marcar números como vendidos
        selectedNumbers.forEach(number => {
            const numberElement = document.querySelector(`[data-number="${number}"]`);
            if (numberElement) {
                numberElement.classList.add('sold');
                numberElement.classList.remove('available', 'selected');
            }
        });

        // Actualizar estadísticas
        if (window.sorteoApp) {
            window.sorteoApp.updateStats();
        }

        // Cerrar modal de compra
        const modal = document.getElementById('purchase-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Muestra mensaje de éxito
     */
    showSuccessMessage(order, pricing, selectedNumbers) {
        const message = `
            <div class="success-payment">
                <h3>🎉 ¡Pago Exitoso!</h3>
                <p><strong>Números comprados:</strong> ${selectedNumbers.join(', ')}</p>
                <p><strong>Monto pagado:</strong> $${pricing.totalUSD} USD (₡${pricing.totalCordobas})</p>
                <p><strong>ID de transacción:</strong> ${order.id}</p>
                <p><strong>Email:</strong> ${order.payer.email_address}</p>
                <p class="success-note">¡Gracias por participar en el sorteo! Te contactaremos pronto.</p>
            </div>
        `;

        this.showMessage(message, 'success');
    }

    /**
     * Muestra mensajes al usuario
     */
    showMessage(message, type = 'info') {
        // Crear o actualizar elemento de mensaje
        let messageElement = document.getElementById('paypal-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'paypal-message';
            document.body.appendChild(messageElement);
        }

        messageElement.className = `paypal-message ${type}`;
        messageElement.innerHTML = message;
        messageElement.style.display = 'block';

        // Auto-ocultar después de 10 segundos para mensajes de éxito
        if (type === 'success') {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 10000);
        }
    }

    /**
     * Obtiene información de precios para mostrar en UI
     */
    getPricingInfo() {
        return this.calculateTotalPrice();
    }
}

// Crear instancia global
window.paypalIntegration = new PayPalIntegration();
