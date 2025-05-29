/**
 * Panel de Administración - Sorteo Adidas
 * Funcionalidades para gestionar el sorteo
 */

class AdminPanel {
    constructor() {
        this.pricePerNumber = 70;
        this.isAuthenticated = false;
        this.adminPassword = null;
        this.init();
    }

    async init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        try {
            // Cargar configuración de autenticación
            await this.loadAuthConfig();

            // Verificar si ya está autenticado
            if (this.checkAuthStatus()) {
                await this.initializeAdminPanel();
            } else {
                this.showLoginScreen();
            }

        } catch (error) {
            console.error('❌ Error al inicializar panel admin:', error);
            this.showLoginScreen();
        }
    }

    async loadAuthConfig() {
        // Intentar cargar contraseña desde variables de entorno
        try {
            const response = await fetch('/.netlify/functions/get-config');
            if (response.ok) {
                const config = await response.json();
                this.adminPassword = config.ADMIN_PASSWORD || 'admin123';
            }
        } catch (error) {
            console.log('No se pudo cargar config de auth, usando contraseña por defecto');
        }

        // Fallback a contraseña por defecto
        if (!this.adminPassword) {
            this.adminPassword = localStorage.getItem('admin-password') || 'admin123';
        }
    }

    checkAuthStatus() {
        const authToken = sessionStorage.getItem('admin-auth');
        const authTime = sessionStorage.getItem('admin-auth-time');

        if (!authToken || !authTime) {
            return false;
        }

        // Verificar si la sesión ha expirado (4 horas)
        const fourHours = 4 * 60 * 60 * 1000;
        if (Date.now() - parseInt(authTime) > fourHours) {
            this.logout();
            return false;
        }

        this.isAuthenticated = true;
        return true;
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-container').style.display = 'none';

        // Configurar event listeners para el login
        this.setupLoginEventListeners();
    }

    setupLoginEventListeners() {
        const loginForm = document.getElementById('login-form');
        const passwordToggle = document.getElementById('password-toggle');
        const passwordInput = document.getElementById('admin-password');

        // Event listener para el formulario
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Event listener para mostrar/ocultar contraseña
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Event listener para indicador de fuerza de contraseña
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
            passwordInput.addEventListener('focus', () => this.animatePasswordFocus(true));
            passwordInput.addEventListener('blur', () => this.animatePasswordFocus(false));
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('admin-password');
        const passwordToggle = document.getElementById('password-toggle');
        const eyeIcon = document.getElementById('eye-icon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.textContent = '🙈';
            passwordToggle.classList.add('hidden');
            passwordInput.style.fontFamily = 'var(--font-primary)';
            passwordInput.style.letterSpacing = 'normal';
        } else {
            passwordInput.type = 'password';
            eyeIcon.textContent = '👁️';
            passwordToggle.classList.remove('hidden');
            passwordInput.style.fontFamily = "'Courier New', monospace";
            passwordInput.style.letterSpacing = '2px';
        }

        // Animación del botón
        passwordToggle.style.transform = 'scale(0.8)';
        setTimeout(() => {
            passwordToggle.style.transform = 'scale(1.1)';
            setTimeout(() => {
                passwordToggle.style.transform = 'scale(1)';
            }, 150);
        }, 150);
    }

    updatePasswordStrength(password) {
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');

        if (!password) {
            strengthFill.style.width = '0%';
            strengthText.textContent = 'Ingresa tu contraseña';
            strengthText.className = 'strength-text';
            return;
        }

        // Calcular fuerza de la contraseña
        let strength = 0;
        let feedback = '';

        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^A-Za-z0-9]/.test(password)) strength += 10;

        // Determinar nivel y mensaje
        if (strength < 30) {
            feedback = 'Contraseña débil';
            strengthText.className = 'strength-text weak';
            strengthFill.style.background = 'linear-gradient(90deg, #ff5722, #ff7043)';
        } else if (strength < 70) {
            feedback = 'Contraseña media';
            strengthText.className = 'strength-text medium';
            strengthFill.style.background = 'linear-gradient(90deg, #ff9800, #ffb74d)';
        } else {
            feedback = 'Contraseña fuerte';
            strengthText.className = 'strength-text strong';
            strengthFill.style.background = 'linear-gradient(90deg, #4caf50, #66bb6a)';
        }

        strengthFill.style.width = `${Math.min(strength, 100)}%`;
        strengthText.textContent = feedback;
    }

    animatePasswordFocus(focused) {
        const passwordContainer = document.querySelector('.password-container');
        const strengthBar = document.querySelector('.password-strength');

        if (focused) {
            passwordContainer.style.transform = 'scale(1.02)';
            strengthBar.style.opacity = '1';
            strengthBar.style.transform = 'translateY(0)';
        } else {
            passwordContainer.style.transform = 'scale(1)';
            // Mantener visible si hay texto
            const passwordInput = document.getElementById('admin-password');
            if (!passwordInput.value) {
                strengthBar.style.opacity = '0.7';
                strengthBar.style.transform = 'translateY(-5px)';
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const password = document.getElementById('admin-password').value;
        const errorDiv = document.getElementById('login-error');
        const buttonText = document.querySelector('.button-text');
        const buttonLoader = document.getElementById('button-loader');
        const loginButton = document.querySelector('.login-button');

        // Mostrar animación de carga
        this.showLoginLoader(true);

        // Simular tiempo de verificación para mejor UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (password === this.adminPassword) {
            // Autenticación exitosa
            this.isAuthenticated = true;
            sessionStorage.setItem('admin-auth', 'authenticated');
            sessionStorage.setItem('admin-auth-time', Date.now().toString());

            // Animación de éxito
            loginButton.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
            buttonText.textContent = '✅ Acceso Concedido';

            // Esperar un momento antes de cambiar de pantalla
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Ocultar login y mostrar panel con animación
            document.getElementById('login-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('admin-container').style.display = 'block';
                document.getElementById('admin-container').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('admin-container').style.opacity = '1';
                }, 100);
            }, 500);

            // Inicializar panel
            await this.initializeAdminPanel();

        } else {
            // Ocultar loader
            this.showLoginLoader(false);

            // Animación de error
            loginButton.style.background = 'linear-gradient(135deg, #f44336, #e57373)';
            buttonText.textContent = '❌ Acceso Denegado';

            // Mostrar error con animación
            errorDiv.style.display = 'flex';
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                errorDiv.style.opacity = '1';
            }, 100);

            // Limpiar campo de contraseña
            document.getElementById('admin-password').value = '';
            this.updatePasswordStrength('');

            // Restaurar botón después de 2 segundos
            setTimeout(() => {
                loginButton.style.background = 'var(--gradient-accent)';
                buttonText.textContent = '🚀 Acceder al Panel';

                // Ocultar error después de 3 segundos más
                setTimeout(() => {
                    errorDiv.style.opacity = '0';
                    setTimeout(() => {
                        errorDiv.style.display = 'none';
                    }, 300);
                }, 3000);
            }, 2000);
        }
    }

    showLoginLoader(show) {
        const buttonText = document.querySelector('.button-text');
        const buttonLoader = document.getElementById('button-loader');
        const loginButton = document.querySelector('.login-button');

        if (show) {
            buttonText.style.opacity = '0';
            buttonLoader.style.display = 'block';
            loginButton.disabled = true;
            loginButton.style.cursor = 'not-allowed';
        } else {
            buttonText.style.opacity = '1';
            buttonLoader.style.display = 'none';
            loginButton.disabled = false;
            loginButton.style.cursor = 'pointer';
        }
    }

    async initializeAdminPanel() {
        try {
            // Esperar a que SheetsAPI esté lista
            await this.waitForSheetsAPI();

            // Configurar event listeners
            this.setupEventListeners();

            // Cargar configuración guardada
            this.loadConfig();

            // Actualizar datos iniciales
            this.updateStats();
            this.updateSoldNumbersList();

            // Auto-actualizar cada 30 segundos
            setInterval(() => this.refreshData(), 30000);

            console.log('✅ Panel de administración inicializado');

        } catch (error) {
            console.error('❌ Error al inicializar panel admin:', error);
        }
    }

    logout() {
        sessionStorage.removeItem('admin-auth');
        sessionStorage.removeItem('admin-auth-time');
        this.isAuthenticated = false;

        // Mostrar login screen
        this.showLoginScreen();

        this.showNotification('Sesión cerrada correctamente', 'info');
    }

    async waitForSheetsAPI() {
        return new Promise((resolve) => {
            const checkAPI = () => {
                if (window.sheetsAPI && window.sheetsAPI.numbersState.size > 0) {
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        });
    }

    setupEventListeners() {
        // Formulario de venta manual
        const manualForm = document.getElementById('manual-sale-form');
        if (manualForm) {
            manualForm.addEventListener('submit', (e) => this.handleManualSale(e));
        }

        // Auto-formatear número
        const numberInput = document.getElementById('manual-number');
        if (numberInput) {
            numberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 0) {
                    value = value.padStart(3, '0').slice(0, 3);
                }
                e.target.value = value;
            });
        }

        // Auto-formatear teléfono
        const phoneInput = document.getElementById('manual-telefono');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.startsWith('505')) {
                    value = '+' + value;
                } else if (value.length === 8) {
                    value = '+505 ' + value;
                }
                e.target.value = value;
            });
        }
    }

    updateStats() {
        const stats = window.sheetsAPI.getStats();

        // Actualizar contadores
        document.getElementById('total-vendidos').textContent = stats.sold;
        document.getElementById('total-disponibles').textContent = stats.available;
        document.getElementById('total-recaudado').textContent = (stats.sold * this.pricePerNumber).toLocaleString();
        document.getElementById('porcentaje-vendido').textContent = `${stats.percentage}%`;
    }

    updateSoldNumbersList() {
        const soldList = document.getElementById('sold-numbers-list');
        if (!soldList) return;

        soldList.innerHTML = '';

        const soldNumbers = [];
        window.sheetsAPI.getNumbersState().forEach((state, number) => {
            if (state.status === 'sold') {
                soldNumbers.push({ number, ...state });
            }
        });

        // Ordenar por número
        soldNumbers.sort((a, b) => a.number.localeCompare(b.number));

        if (soldNumbers.length === 0) {
            soldList.innerHTML = '<p style="text-align: center; color: var(--gray-dark); padding: 2rem;">No hay números vendidos aún</p>';
            return;
        }

        soldNumbers.forEach(item => {
            const soldItem = document.createElement('div');
            soldItem.className = 'sold-item';

            const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A';

            soldItem.innerHTML = `
                <div class="sold-number">${item.number}</div>
                <div class="sold-buyer">
                    <strong>${item.buyer || 'Sin nombre'}</strong>
                    <small>${item.phone || 'Sin teléfono'} • ${date}</small>
                </div>
                <button class="admin-button secondary" style="padding: 0.5rem; font-size: 0.8rem;"
                        onclick="adminPanel.removeNumber('${item.number}')">
                    ❌
                </button>
            `;

            soldList.appendChild(soldItem);
        });
    }

    async handleManualSale(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const number = formData.get('manual-number') || document.getElementById('manual-number').value;
        const nombre = formData.get('manual-nombre') || document.getElementById('manual-nombre').value;
        const telefono = formData.get('manual-telefono') || document.getElementById('manual-telefono').value;
        const email = formData.get('manual-email') || document.getElementById('manual-email').value;

        // Validar datos
        if (!number || !nombre || !telefono) {
            this.showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        // Validar número
        if (!/^\d{3}$/.test(number) || parseInt(number) < 1 || parseInt(number) > 99) {
            this.showNotification('Número inválido. Debe ser entre 001 y 099', 'error');
            return;
        }

        // Verificar disponibilidad
        const numberState = window.sheetsAPI.getNumberState(number);
        if (!numberState || numberState.status !== 'available') {
            this.showNotification('Este número no está disponible', 'error');
            return;
        }

        try {
            // Registrar venta
            const buyerInfo = { nombre, telefono, email };
            await window.sheetsAPI.sellNumbers([number], buyerInfo);

            // Limpiar formulario
            e.target.reset();

            // Actualizar vista
            this.updateStats();
            this.updateSoldNumbersList();

            this.showNotification(`Número ${number} vendido exitosamente a ${nombre}`, 'success');

        } catch (error) {
            console.error('Error en venta manual:', error);
            this.showNotification('Error al registrar la venta', 'error');
        }
    }

    async removeNumber(number) {
        if (!confirm(`¿Estás seguro de que quieres liberar el número ${number}?`)) {
            return;
        }

        try {
            // Cambiar estado a disponible
            const numberState = window.sheetsAPI.getNumberState(number);
            if (numberState) {
                numberState.status = 'available';
                numberState.buyer = null;
                numberState.phone = null;
                numberState.email = null;
                numberState.timestamp = null;
            }

            // Actualizar vista
            this.updateStats();
            this.updateSoldNumbersList();

            this.showNotification(`Número ${number} liberado exitosamente`, 'success');

        } catch (error) {
            console.error('Error al liberar número:', error);
            this.showNotification('Error al liberar el número', 'error');
        }
    }

    async refreshData() {
        try {
            await window.sheetsAPI.refresh();
            this.updateStats();
            this.updateSoldNumbersList();
            this.showNotification('Datos actualizados', 'success');
        } catch (error) {
            console.warn('Error al actualizar datos:', error);
            this.showNotification('Error al actualizar datos', 'error');
        }
    }

    exportData() {
        const soldNumbers = [];
        window.sheetsAPI.getNumbersState().forEach((state, number) => {
            if (state.status === 'sold') {
                soldNumbers.push({
                    numero: number,
                    comprador: state.buyer,
                    telefono: state.phone,
                    email: state.email,
                    fecha: state.timestamp
                });
            }
        });

        if (soldNumbers.length === 0) {
            this.showNotification('No hay datos para exportar', 'error');
            return;
        }

        // Crear CSV
        const headers = ['Número', 'Comprador', 'Teléfono', 'Email', 'Fecha'];
        const csvContent = [
            headers.join(','),
            ...soldNumbers.map(row => [
                row.numero,
                `"${row.comprador}"`,
                row.telefono,
                row.email,
                row.fecha
            ].join(','))
        ].join('\n');

        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sorteo-adidas-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Datos exportados exitosamente', 'success');
    }

    clearReservations() {
        if (!confirm('¿Estás seguro de que quieres limpiar todas las reservas?')) {
            return;
        }

        let cleared = 0;
        window.sheetsAPI.getNumbersState().forEach((state, number) => {
            if (state.status === 'reserved') {
                state.status = 'available';
                delete state.reservedUntil;
                cleared++;
            }
        });

        this.updateStats();
        this.showNotification(`${cleared} reservas limpiadas`, 'success');
    }

    resetSorteo() {
        const confirmation = prompt('⚠️ PELIGRO: Esto eliminará TODOS los datos del sorteo.\n\nEscribe "RESET" para confirmar:');

        if (confirmation !== 'RESET') {
            this.showNotification('Operación cancelada', 'info');
            return;
        }

        // Reiniciar todos los números
        for (let i = 1; i <= 99; i++) {
            const number = i.toString().padStart(3, '0');
            window.sheetsAPI.numbersState.set(number, {
                number: number,
                status: 'available',
                buyer: null,
                phone: null,
                email: null,
                timestamp: null
            });
        }

        this.updateStats();
        this.updateSoldNumbersList();
        this.showNotification('Sorteo reiniciado completamente', 'success');
    }

    saveConfig() {
        const sheetId = document.getElementById('sheet-id').value;
        const apiKey = document.getElementById('api-key').value;

        if (!sheetId || !apiKey) {
            this.showNotification('Por favor completa ambos campos', 'error');
            return;
        }

        // Guardar en localStorage
        localStorage.setItem('sorteo-sheet-id', sheetId);
        localStorage.setItem('sorteo-api-key', apiKey);

        // Actualizar SheetsAPI
        window.sheetsAPI.SHEET_ID = sheetId;
        window.sheetsAPI.API_KEY = apiKey;
        window.sheetsAPI.READ_URL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${window.sheetsAPI.RANGE}?key=${apiKey}`;
        window.sheetsAPI.WRITE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${window.sheetsAPI.RANGE}:append?valueInputOption=RAW&key=${apiKey}`;

        this.showNotification('Configuración guardada exitosamente', 'success');
    }

    loadConfig() {
        const sheetId = localStorage.getItem('sorteo-sheet-id');
        const apiKey = localStorage.getItem('sorteo-api-key');

        if (sheetId) {
            document.getElementById('sheet-id').value = sheetId;
        }
        if (apiKey) {
            document.getElementById('api-key').value = apiKey;
        }
    }

    async testConnection() {
        const sheetId = document.getElementById('sheet-id').value;
        const apiKey = document.getElementById('api-key').value;

        if (!sheetId || !apiKey) {
            this.showNotification('Por favor completa la configuración primero', 'error');
            return;
        }

        try {
            const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:A1?key=${apiKey}`;
            const response = await fetch(testUrl);

            if (response.ok) {
                this.showNotification('✅ Conexión exitosa con Google Sheets', 'success');
            } else {
                this.showNotification('❌ Error de conexión. Verifica tus credenciales', 'error');
            }
        } catch (error) {
            this.showNotification('❌ Error de red. Verifica tu conexión', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Estilos inline para la notificación
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 2rem',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#00cc66' :
                           type === 'error' ? '#ff0000' : '#0066cc'
        });

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Funciones globales para el HTML
function refreshData() {
    window.adminPanel.refreshData();
}

function exportData() {
    window.adminPanel.exportData();
}

function clearReservations() {
    window.adminPanel.clearReservations();
}

function resetSorteo() {
    window.adminPanel.resetSorteo();
}

function saveConfig() {
    window.adminPanel.saveConfig();
}

function testConnection() {
    window.adminPanel.testConnection();
}

function logout() {
    window.adminPanel.logout();
}

// Inicializar panel de administración
window.adminPanel = new AdminPanel();
