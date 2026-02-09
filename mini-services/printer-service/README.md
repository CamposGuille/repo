# Servicio de Impresión Local para Tótem

Este mini servicio permite imprimir tickets directamente en impresoras térmicas conectadas por USB **sin diálogo de impresión**.

## 🚀 Características

- Impresión directa sin diálogo de impresión del navegador
- Compatibilidad con impresoras térmicas (ESC/POS)
- Detección automática de impresoras USB
- Selección de múltiples impresoras (si hay más de una)
- Formato de ticket personalizable

## 📋 Requisitos

- Impresora térmica USB (ej: 3nstar RPT005, Epson, Star Micronics, etc.)
- La impresora debe estar conectada al tótem
- Node.js / Bun runtime

## 🔧 Instalación

1. El servicio ya está instalado en: `mini-services/printer-service/`

2. Las dependencias ya están instaladas

## 🏃 Ejecución

### Desde la línea de comandos (en el tótem):

```bash
cd /home/z/my-project/mini-services/printer-service
bun run dev
```

El servicio iniciará en el puerto **3004**

## 📡 API Endpoints

### 1. Verificar estado del servicio

```bash
GET http://localhost:3004/health
```

**Respuesta:**
```json
{
  "success": true,
  "printers": 1,
  "selected": {
    "vendorId": 1234,
    "productId": 5678
  }
}
```

### 2. Listar impresoras disponibles

```bash
GET http://localhost:3004/api/impresoras
```

**Respuesta:**
```json
{
  "printers": [
    {
      "vendorId": 1234,
      "productId": 5678
    }
  ],
  "selected": 0
}
```

### 3. Seleccionar impresora

```bash
POST http://localhost:3004/api/impresoras/seleccionar
Content-Type: application/json

{
  "index": 0
}
```

### 4. Imprimir ticket ⭐

```bash
POST http://localhost:3004/api/imprimir
Content-Type: application/json

{
  "title": "TICKET",
  "content": "Contenido adicional del ticket",
  "turno": {
    "numero": "A001",
    "sector": "Farmacia",
    "fecha": "2024-01-15",
    "hora": "14:30"
  },
  "footer": "¡Gracias por su visita!"
}
```

**Respuesta:**
```json
{
  "success": true
}
```

## 🎨 Formato del Ticket

El ticket impreso incluye:

1. **Título** (centrado, doble tamaño, negrita)
2. **Línea separadora**
3. **Contenido** (texto adicional personalizado, alineado a la izquierda)
4. **Información del turno**:
   - Número de turno (centrado, negrita)
   - Sector
   - Fecha
   - Hora
5. **Pie de página** (centrado)
6. **Corte de papel automático** (si la impresora lo soporta)

## 💻 Uso desde la Web

Para imprimir desde tu aplicación Next.js:

```typescript
const imprimirTicket = async (turno: any) => {
  try {
    const response = await fetch('/api/imprimir?XTransformPort=3004', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'TICKET DE TURNO',
        turno: {
          numero: turno.numero,
          sector: turno.sectorNombre,
          fecha: new Date().toLocaleDateString('es-AR'),
          hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        },
        footer: '¡Gracias por su espera!',
      }),
    })

    const result = await response.json()
    if (result.success) {
      console.log('✅ Ticket impreso correctamente')
    }
  } catch (error) {
    console.error('❌ Error al imprimir:', error)
  }
}
```

## 🔌 Detección de Impresoras

El servicio detecta automáticamente impresoras USB basándose en:

- Device Class 0x07 (Printer)
- Vendor IDs conocidos (Epson, Star Micronics, 3nStar, HP, etc.)
- Nombre del producto que contenga "Printer"
- Fabricante que contenga "Printer"

Si tu impresora no se detecta, puedes agregar su Vendor ID a la lista en `index.ts`:

```typescript
const printerVendors = [
  0x04B8, // Epson
  0x0519, // Star Micronics
  0xXXXX, // Tu Vendor ID aquí
]
```

## 🐛 Solución de Problemas

### No se detecta la impresora

1. Verifica que la impresora esté conectada y encendida
2. Ejecuta el servicio y revisa el log: `"🔍 Buscando impresoras USB..."`
3. Si no se detecta, agrega el Vendor ID de tu impresora al código

### Error al imprimir

1. Verifica que la impresora tenga papel
2. Revisa que no haya errores en la impresora (luz roja)
3. Revisa el log del servicio para más detalles

### Error de permisos (Linux/Mac)

Si tienes problemas de permisos USB:

```bash
# Linux
sudo usermod -a -G dialout $USER

# Mac
No requiere configuración especial
```

### Compatibilidad con Windows

En Windows, el driver de la impresora puede reclamar acceso exclusivo al puerto USB.

**Solución:**

1. Desinstalar el driver de la impresora
2. Usar la impresora en modo de "comunicación directa" sin driver
3. O usar una librería alternativa que se conecte por puerto virtual COM

## 📦 Despliegue en Producción

Para desplegar en el tótem:

1. Copiar la carpeta `mini-services/printer-service/` al tótem
2. Instalar dependencias: `bun install`
3. Iniciar el servicio: `bun run dev`
4. Configurar para que inicie automáticamente al encender el tótem

### Auto-start en Linux (systemd)

Crear archivo `/etc/systemd/system/printer-service.service`:

```ini
[Unit]
Description=Printer Service for Totem
After=network.target

[Service]
Type=simple
User=usuario-del-totem
WorkingDirectory=/ruta/a/printer-service
ExecStart=/usr/local/bin/bun run dev
Restart=always

[Install]
WantedBy=multi-user.target
```

Habilitar:
```bash
sudo systemctl enable printer-service
sudo systemctl start printer-service
```

## 🔒 Seguridad

El servicio escucha en `localhost:3004`, por lo que solo es accesible desde la máquina local.

## 📝 Logs

El servicio imprime logs en la consola:

```
╔════════════════════════════════════════════════╗
║   SERVICIO DE IMPRESIÓN LOCAL - TÓTEM         ║
╚════════════════════════════════════════════════╝
🚀 Servidor iniciado en puerto 3004

📡 Endpoints disponibles:
   GET  /health               - Estado del servicio
   GET  /api/impresoras       - Listar impresoras
   POST /api/impresoras/seleccionar - Seleccionar impresora
   POST /api/imprimir         - Imprimir ticket

🔍 Buscando impresoras USB...
🖨️  Encontradas 1 impresoras:
   1. Vendor: 0x04B8, Product: 0x0202
✅ Impresora seleccionada automáticamente
✅ Impresora conectada
🖨️  Ticket impreso: A001
```

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del servicio
2. Verifica la conexión USB de la impresora
3. Prueba con otra impresora thermal compatible ESC/POS
