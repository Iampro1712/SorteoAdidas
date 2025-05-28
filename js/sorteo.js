/**
 * Sorteo Adidas - JavaScript Principal
 * Maneja toda la lógica del frontend del sorteo
 */

class SorteoApp {
    constructor() {
        this.selectedNumbers = new Set();
        this.pricePerNumber = 70;
        this.isLoading = true;
        
        // Elementos del DOM
        this.elements = {};
        
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
            // Obtener referencias a elementos del DOM
            this.getElements();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Esperar a que SheetsAPI esté lista
            await this.waitForSheetsAPI();
            
            // Generar grid de números
            this.generateNumbersGrid();
            
            // Actualizar estadísticas
            this.updateStats();
            
            // Ocultar pantalla de carga
            this.hideLoadingScreen();
            
            console.log('✅ Sorteo App inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar la app:', error);
            this.hideLoadingScreen();
        }
    }
    
    getElements() {
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            numbersGrid: document.getElementById('numbers-grid'),
            selectedNumbers: document.getElementById('selected-numbers'),
            selectedList: document.getElementById('selected-list'),
            totalPrice: document.getElementById('total-price'),
            numerosVendidos: document.getElementById('numeros-vendidos'),
            numerosDisponibles: document.getElementById('numeros-disponibles'),
            progressFill: document.getElementById('progress-fill'),
            progressPercentage: document.getElementById('progress-percentage'),
            purchaseModal: document.getElementById('purchase-modal'),
            purchaseForm: document.getElementById('purchase-form'),
            summaryNumbers: document.getElementById('summary-numbers'),
            summaryTotal: document.getElementById('summary-total'),
            navToggle: document.querySelector('.nav-toggle'),
            navLinks: document.querySelector('.nav-links')
        };
    }
    
    setupEventListeners() {
        // Filtros de números
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterNumbers(e.target.dataset.filter));
        });
        
        // Formulario de compra
        if (this.elements.purchaseForm) {
            this.elements.purchaseForm.addEventListener('submit', (e) => this.handlePurchaseSubmit(e));
        }
        
        // Navegación móvil
        if (this.elements.navToggle) {
            this.elements.navToggle.addEventListener('click', () => this.toggleMobileNav());
        }
        
        // Cerrar modal al hacer clic fuera
        if (this.elements.purchaseModal) {
            this.elements.purchaseModal.addEventListener('click', (e) => {
                if (e.target === this.elements.purchaseModal) {
                    this.closePurchaseForm();
                }
            });
        }
        
        // Scroll suave para navegación
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Actualizar datos cada 30 segundos
        setInterval(() => this.refreshData(), 30000);
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
    
    generateNumbersGrid() {
        if (!this.elements.numbersGrid) return;
        
        this.elements.numbersGrid.innerHTML = '';
        
        for (let i = 1; i <= 99; i++) {
            const number = i.toString().padStart(3, '0');
            const numberState = window.sheetsAPI.getNumberState(number);
            
            const numberCard = document.createElement('div');
            numberCard.className = `number-card ${numberState.status}`;
            numberCard.textContent = number;
            numberCard.dataset.number = number;
            
            // Solo agregar event listener si está disponible
            if (numberState.status === 'available') {
                numberCard.addEventListener('click', () => this.toggleNumber(number));
            }
            
            this.elements.numbersGrid.appendChild(numberCard);
        }
    }
    
    toggleNumber(number) {
        const numberState = window.sheetsAPI.getNumberState(number);
        
        if (numberState.status !== 'available') {
            this.showNotification('Este número no está disponible', 'error');
            return;
        }
        
        const numberCard = document.querySelector(`[data-number="${number}"]`);
        
        if (this.selectedNumbers.has(number)) {
            // Deseleccionar
            this.selectedNumbers.delete(number);
            numberCard.classList.remove('selected');
        } else {
            // Seleccionar
            this.selectedNumbers.add(number);
            numberCard.classList.add('selected');
        }
        
        this.updateSelectedDisplay();
    }
    
    updateSelectedDisplay() {
        const selectedCount = this.selectedNumbers.size;
        
        if (selectedCount === 0) {
            this.elements.selectedNumbers.style.display = 'none';
            return;
        }
        
        this.elements.selectedNumbers.style.display = 'block';
        
        // Actualizar lista de números seleccionados
        this.elements.selectedList.innerHTML = '';
        this.selectedNumbers.forEach(number => {
            const span = document.createElement('span');
            span.className = 'selected-number';
            span.innerHTML = `${number} <span class="remove-number" onclick="sorteoApp.removeNumber('${number}')">&times;</span>`;
            this.elements.selectedList.appendChild(span);
        });
        
        // Actualizar precio total
        const total = selectedCount * this.pricePerNumber;
        this.elements.totalPrice.textContent = total;
    }
    
    removeNumber(number) {
        this.selectedNumbers.delete(number);
        const numberCard = document.querySelector(`[data-number="${number}"]`);
        if (numberCard) {
            numberCard.classList.remove('selected');
        }
        this.updateSelectedDisplay();
    }
    
    filterNumbers(filter) {
        // Actualizar botones de filtro
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Filtrar números
        document.querySelectorAll('.number-card').forEach(card => {
            const status = card.classList.contains('available') ? 'available' :
                          card.classList.contains('sold') ? 'sold' :
                          card.classList.contains('reserved') ? 'reserved' : 'unknown';
            
            if (filter === 'all' || status === filter) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    updateStats() {
        const stats = window.sheetsAPI.getStats();
        
        // Actualizar contadores
        if (this.elements.numerosVendidos) {
            this.elements.numerosVendidos.textContent = stats.sold;
        }
        if (this.elements.numerosDisponibles) {
            this.elements.numerosDisponibles.textContent = stats.available;
        }
        
        // Actualizar barra de progreso
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${stats.percentage}%`;
        }
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${stats.percentage}%`;
        }
    }
    
    async refreshData() {
        try {
            await window.sheetsAPI.refresh();
            this.generateNumbersGrid();
            this.updateStats();
            console.log('🔄 Datos actualizados');
        } catch (error) {
            console.warn('⚠️ Error al actualizar datos:', error);
        }
    }
    
    openPurchaseForm() {
        if (this.selectedNumbers.size === 0) {
            this.showNotification('Selecciona al menos un número', 'error');
            return;
        }
        
        // Reservar números temporalmente
        const numbersArray = Array.from(this.selectedNumbers);
        window.sheetsAPI.reserveNumbers(numbersArray);
        
        // Actualizar resumen en el modal
        this.updatePurchaseSummary();
        
        // Mostrar modal
        this.elements.purchaseModal.classList.add('show');
        this.elements.purchaseModal.style.display = 'flex';
        
        // Enfocar primer campo
        const firstInput = this.elements.purchaseForm.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }
    
    closePurchaseForm() {
        this.elements.purchaseModal.classList.remove('show');
        setTimeout(() => {
            this.elements.purchaseModal.style.display = 'none';
        }, 300);
        
        // Liberar números reservados
        const numbersArray = Array.from(this.selectedNumbers);
        window.sheetsAPI.releaseReservedNumbers(numbersArray);
    }
    
    updatePurchaseSummary() {
        const numbersArray = Array.from(this.selectedNumbers);
        const total = numbersArray.length * this.pricePerNumber;
        
        this.elements.summaryNumbers.innerHTML = numbersArray.map(num => 
            `<span class="selected-number">${num}</span>`
        ).join(' ');
        
        this.elements.summaryTotal.textContent = `${total} córdobas`;
    }
    
    async handlePurchaseSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const buyerInfo = {
            nombre: formData.get('nombre'),
            telefono: formData.get('telefono'),
            email: formData.get('email') || ''
        };
        
        // Validar datos
        if (!buyerInfo.nombre || !buyerInfo.telefono) {
            this.showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        try {
            // Marcar números como vendidos
            const numbersArray = Array.from(this.selectedNumbers);
            await window.sheetsAPI.sellNumbers(numbersArray, buyerInfo);
            
            // Generar mensaje de WhatsApp
            this.sendWhatsAppMessage(numbersArray, buyerInfo);
            
            // Limpiar selección
            this.selectedNumbers.clear();
            this.updateSelectedDisplay();
            
            // Actualizar vista
            this.generateNumbersGrid();
            this.updateStats();
            
            // Cerrar modal
            this.closePurchaseForm();
            
            this.showNotification('¡Compra realizada exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error al procesar compra:', error);
            this.showNotification('Error al procesar la compra. Intenta nuevamente.', 'error');
        }
    }
    
    sendWhatsAppMessage(numbers, buyerInfo) {
        const total = numbers.length * this.pricePerNumber;
        const numbersText = numbers.join(', ');
        
        const message = `🏆 *SORTEO ADIDAS - NUEVA COMPRA*\n\n` +
                       `👤 *Cliente:* ${buyerInfo.nombre}\n` +
                       `📱 *Teléfono:* ${buyerInfo.telefono}\n` +
                       `📧 *Email:* ${buyerInfo.email}\n\n` +
                       `🎯 *Números:* ${numbersText}\n` +
                       `💰 *Total:* ${total} córdobas\n\n` +
                       `*Información de pago:*\n` +
                       `Banco: BAC\n` +
                       `Cuenta: 123456789\n\n` +
                       `_Mensaje generado automáticamente_`;
        
        const whatsappURL = `https://wa.me/50588888888?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }
    
    toggleMobileNav() {
        this.elements.navLinks.classList.toggle('show');
    }
    
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
            }, 500);
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
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Funciones globales para el HTML
function scrollToNumbers() {
    document.getElementById('numeros').scrollIntoView({ behavior: 'smooth' });
}

function openPurchaseForm() {
    window.sorteoApp.openPurchaseForm();
}

function closePurchaseForm() {
    window.sorteoApp.closePurchaseForm();
}

// Inicializar aplicación
window.sorteoApp = new SorteoApp();
