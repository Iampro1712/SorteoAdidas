# 🏆 Sorteo Adidas - Sistema Completo

Sistema web completo para sorteos de productos con integración a Google Sheets como base de datos gratuita.

## ✨ Características

- **🎯 99 números disponibles** a C$70 cada uno
- **📱 Diseño responsive** optimizado para móviles
- **⚡ Carga ultra-rápida** con optimizaciones de rendimiento
- **🔄 Sincronización en tiempo real** con Google Sheets
- **💳 Integración con WhatsApp** para confirmaciones
- **🛠️ Panel de administración** completo
- **🆓 100% gratuito** - sin costos de hosting ni base de datos

## 🚀 Despliegue en Netlify

### 1. Preparar el repositorio
```bash
git init
git add .
git commit -m "Initial commit - Sorteo Adidas"
git branch -M main
git remote add origin https://github.com/tu-usuario/sorteo-adidas.git
git push -u origin main
```

### 2. Conectar con Netlify
1. Ve a [netlify.com](https://netlify.com) y crea una cuenta gratuita
2. Haz clic en "New site from Git"
3. Conecta tu repositorio de GitHub
4. Configuración de build:
   - **Build command:** `echo 'Static site'`
   - **Publish directory:** `.`
5. Haz clic en "Deploy site"

### 3. Configurar dominio personalizado (opcional)
- En Netlify: Site settings > Domain management
- Agrega tu dominio personalizado

## 📊 Configuración de Google Sheets

### 1. Crear Google Sheet
1. Ve a [sheets.google.com](https://sheets.google.com)
2. Crea una nueva hoja llamada "Sorteo"
3. Agrega estos headers en la fila 1:
   ```
   A1: Número
   B1: Estado
   C1: Comprador
   D1: Teléfono
   E1: Email
   F1: Fecha
   ```

### 2. Obtener API Key
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Sheets:
   - APIs & Services > Library
   - Busca "Google Sheets API" y habilítala
4. Crear credenciales:
   - APIs & Services > Credentials
   - Create Credentials > API Key
   - Copia tu API Key

### 3. Configurar permisos
1. En tu Google Sheet, haz clic en "Compartir"
2. Cambia los permisos a "Cualquier persona con el enlace puede ver"
3. Copia el ID de la hoja (está en la URL entre `/d/` y `/edit`)

### 4. Configurar variables de entorno en Netlify
1. Ve a tu sitio en Netlify Dashboard
2. Site settings > Environment variables
3. Agrega estas variables:
   ```
   GOOGLE_SHEET_ID = tu_sheet_id_aqui
   GOOGLE_API_KEY = tu_api_key_aqui
   ADMIN_PASSWORD = tu_password_seguro_aqui
   ```
4. Haz clic en "Save"
5. Redeploy el sitio para aplicar los cambios

### 5. Verificar configuración
1. Ve a `tu-sitio.netlify.app/admin.html`
2. Si las variables están configuradas correctamente, verás los datos cargándose automáticamente
3. Como respaldo, también puedes configurar manualmente desde el panel admin

## 🔒 Configuración de Seguridad

### Variables de entorno en Netlify:
1. **Nunca** hardcodees API keys en el código
2. Usa siempre variables de entorno en Netlify:
   - `Site settings > Environment variables`
   - Agrega `GOOGLE_SHEET_ID` y `GOOGLE_API_KEY`
3. Las variables se cargan automáticamente via función serverless

### Configuración local para desarrollo:
1. Copia `.env.example` a `.env`
2. Completa con tus valores reales
3. El archivo `.env` está en `.gitignore` para protección

### Permisos de Google Sheets:
- Configura la hoja como "Cualquier persona con el enlace puede ver"
- Esto permite acceso de solo lectura público
- La API Key controla el acceso de escritura

### Seguridad del Panel de Administración:
- **Acceso protegido:** Requiere contraseña para acceder
- **Sesión temporal:** Se cierra automáticamente después de 4 horas
- **Contraseña configurable:** Se define en variables de entorno
- **Contraseña por defecto:** `admin123` (¡CÁMBIALA INMEDIATAMENTE!)
- **Logout manual:** Botón para cerrar sesión cuando termines

## 🎨 Personalización

### Cambiar información del sorteo
Edita `index.html`:
```html
<!-- Cambiar detalles del premio -->
<h4>Adidas Predator Club Socks</h4>
<p>Talla: 40 (US 7)</p>
<p>Color: Core Black</p>

<!-- Cambiar información de pago -->
<p>Banco: TU_BANCO</p>
<p>Cuenta: TU_CUENTA</p>
<p>A nombre de: TU_NOMBRE</p>
```

### Cambiar colores y estilos
Edita `css/styles.css`:
```css
:root {
    --primary-black: #000000;    /* Color principal */
    --accent-red: #ff0000;       /* Color de acento */
    --accent-blue: #0066cc;      /* Color secundario */
}
```

### Cambiar precio por número
Edita `js/sorteo.js` y `js/admin.js`:
```javascript
this.pricePerNumber = 70; // Cambiar a tu precio
```

### Cambiar número de WhatsApp
Edita `js/sorteo.js`:
```javascript
const whatsappURL = `https://wa.me/50588888888?text=${encodeURIComponent(message)}`;
// Cambiar 50588888888 por tu número
```

## 📱 Uso del Sistema

### Para clientes:
1. Visitar el sitio web
2. Seleccionar números disponibles
3. Completar formulario de compra
4. Enviar información por WhatsApp
5. Realizar pago según instrucciones

### Para administradores:
1. Acceder a `/admin.html`
2. Ver estadísticas en tiempo real
3. Registrar ventas manuales
4. Exportar datos
5. Gestionar configuración

## 🔧 Funcionalidades Técnicas

### Optimizaciones de rendimiento:
- ✅ CSS y JS minificados
- ✅ Imágenes optimizadas
- ✅ Cache inteligente
- ✅ Lazy loading
- ✅ Preload de recursos críticos

### Características responsive:
- ✅ Mobile-first design
- ✅ Touch-friendly interfaces
- ✅ Adaptive layouts
- ✅ Optimized for all screen sizes

### Seguridad:
- ✅ Variables de entorno para API keys
- ✅ Función serverless para configuración
- ✅ Headers de seguridad
- ✅ Validación de datos
- ✅ Sanitización de inputs
- ✅ Rate limiting (via Netlify)
- ✅ CORS configurado correctamente

## 🆘 Solución de Problemas

### Los números no se actualizan
1. Verifica la configuración de Google Sheets
2. Revisa que la API Key sea válida
3. Confirma que la hoja sea pública
4. Prueba la conexión desde el panel admin

### Error de CORS
- Asegúrate de que la Google Sheet sea pública
- Verifica que la API Key tenga permisos correctos

### El sitio no carga
1. Verifica que todos los archivos estén en el repositorio
2. Revisa los logs de Netlify
3. Confirma que el `netlify.toml` esté configurado

### WhatsApp no abre
- Verifica que el número esté en formato internacional
- Confirma que WhatsApp esté instalado en el dispositivo

## 📈 Escalabilidad

### Para más de 99 números:
1. Modifica el loop en `js/sorteo.js` y `js/admin.js`
2. Ajusta el grid CSS si es necesario
3. Actualiza las validaciones

### Para múltiples sorteos:
1. Crea hojas separadas en Google Sheets
2. Modifica la configuración para seleccionar hoja
3. Agrega selector de sorteo en el admin

## 📞 Soporte

Para soporte técnico o personalizaciones:
- 📧 Email: tu-email@ejemplo.com
- 📱 WhatsApp: +505 8888-8888
- 🌐 Web: tu-sitio-web.com

## 📄 Licencia

MIT License - Libre para uso comercial y personal.

---

**¡Tu sorteo está listo para generar ingresos! 🚀**
