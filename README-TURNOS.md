# Sistema de Gestión de Turnos (Tótem)

Sistema completo de autogestión de turnos con tres interfaces: Tótem para clientes, Panel de Operador (Llamador) y Monitor de visualización en tiempo real.

## 🚀 Características

- **Tótem de Autogestión**: Interfaz intuitiva para que los clientes saquen turnos
- **Panel de Operador**: Dashboard completo para gestionar turnos y atención
- **Monitor en Tiempo Real**: Visualización de turnos activos y llamados
- **Sistema de Notificaciones**: WebSocket para actualizaciones en vivo
- **Autenticación Segura**: Login para operadores con contraseñas hasheadas
- **Diseño Responsive**: Funciona en dispositivos de todos los tamaños
- **Interfaz Profesional**: Diseño moderno con shadcn/ui y Tailwind CSS

## 📋 Requisitos Previos

- Node.js 18+ o Bun
- Base de datos SQLite (Prisma)

## 🔧 Instalación

1. Instalar dependencias:
```bash
bun install
```

2. Configurar la base de datos:
```bash
bun run db:push
```

3. Inicializar datos de prueba:
```bash
bun run db:seed
```

## 🎯 Uso del Sistema

### 1. Iniciar el servidor principal (Next.js)

El servidor principal se ejecuta automáticamente en el puerto 3000:

```bash
bun run dev
```

El servidor está disponible en: http://localhost:3000

### 2. Iniciar el servicio de WebSocket (Opcional, para tiempo real)

Para habilitar las notificaciones en tiempo real, inicie el servicio WebSocket:

```bash
cd mini-services/websocket-service
bun run dev
```

Este servicio corre en el puerto 3003.

**Nota**: El sistema funciona sin el servicio WebSocket, pero las actualizaciones serán periódicas (polling) en lugar de instantáneas.

## 📱 Páginas del Sistema

### Página Principal (/)
Página de navegación con acceso a las tres interfaces principales.

### Tótem (/totem)
Interfaz para que los clientes saquen turnos:
- Teclado numérico para ingresar DNI
- Selección de sector con colores distintivos
- Generación automática de número de turno
- Confirmación visual del turno asignado

### Llamador - Panel de Operador (/llamador)
Dashboard para operadores:
- Login seguro con autenticación
- Lista de turnos en espera
- Funcionalidad para llamar turnos
- Panel de turno actual con acciones (iniciar, finalizar, marcar ausente)

### Monitor (/monitor)
Pantalla de visualización en tiempo real:
- Cards de turnos activos con colores de sector
- Estados visuales (llamando, en atención)
- Horas de llamado y operador asignado
- Actualización automática cada 10 segundos

## 👤 Credenciales de Prueba

El sistema incluye 4 operadores de prueba para probar el Panel de Operador:

| Usuario | Contraseña | Sector |
|---------|-----------|---------|
| cajas1  | admin123  | Cajas  |
| cajas2  | admin123  | Cajas  |
| informes1 | admin123 | Informes |
| atencion1 | admin123 | Atención al Cliente |

## 🔑 Sectores Configurados

El sistema incluye 3 sectores de atención:

1. **Cajas** (Color verde) - Atención en cajas
2. **Informes** (Color azul) - Solicitudes de informes
3. **Atención al Cliente** (Color naranja) - Atención general

## 🔄 Flujo de Trabajo Típico

### Para el Cliente:

1. Ir a la página principal y hacer clic en "Tótem"
2. Ingresar el DNI usando el teclado numérico
3. Seleccionar el servicio deseado
4. Hacer clic en "Generar Turno"
5. Tomar nota del número de turno asignado
6. Esperar en la sala hasta ser llamado

### Para el Operador:

1. Ir a la página principal y hacer clic en "Panel de Operador"
2. Iniciar sesión con las credenciales correspondientes
3. Ver la lista de turnos en espera
4. Hacer clic en "Llamar" para el próximo turno
5. Gestionar la atención (iniciar, finalizar o marcar ausente)

### Para el Monitor:

1. Ir a la página principal y hacer clic en "Monitor de Turnos"
2. Ver los turnos activos en tiempo real
3. La pantalla se actualiza automáticamente

## 🛠️ Arquitectura del Sistema

### Frontend
- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: React Hooks + Zustand

### Backend
- **API**: Next.js API Routes
- **Base de datos**: Prisma ORM con SQLite
- **Autenticación**: bcrypt para hashing de contraseñas

### Tiempo Real (Opcional)
- **Servicio**: Socket.io en mini-service independiente
- **Puerto**: 3003
- **Notificaciones**: HTTP + WebSocket híbrido

### APIs Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/turnos | Listar sectores activos |
| POST | /api/turnos | Crear nuevo turno |
| GET | /api/turnos/listar?sectorId=X | Listar turnos de un sector |
| POST | /api/turnos/llamar | Llamar un turno |
| POST | /api/turnos/actualizar | Actualizar estado de turno |
| GET | /api/turnos/activos | Obtener turnos activos |
| POST | /api/auth/login | Autenticar operador |

## 📊 Estados de Turno

Los turnos pueden tener los siguientes estados:
- **esperando**: Turno en la cola de espera
- **llamado**: Turno ha sido llamado por el operador
- **atendiendo**: Turno está siendo atendido
- **finalizado**: Turno completado exitosamente
- **ausente**: Cliente no se presentó

## 🎨 Diseño y UX

El sistema sigue principios de diseño minimal y profesional:
- Colores distintivos por sector para fácil identificación
- Tipografía legible con buena jerarquía
- Animaciones sutiles para mejor UX
- Diseño responsive para móviles y tablets
- Accesibilidad: WCAG AA compliance, navegación por teclado

## 📁 Estructura del Proyecto

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Página principal
│   │   ├── totem/                   # Tótem de autogestión
│   │   ├── llamador/                # Panel de operador
│   │   └── monitor/                 # Monitor de turnos
│   ├── app/api/
│   │   ├── turnos/                  # APIs de turnos
│   │   └── auth/login/              # API de autenticación
│   ├── lib/
│   │   ├── db.ts                    # Cliente Prisma
│   │   └── websocket/               # Helpers WebSocket
│   └── components/ui/               # Componentes shadcn/ui
├── prisma/
│   ├── schema.prisma                # Esquema de base de datos
│   └── seed.ts                     # Script de datos de prueba
├── mini-services/
│   └── websocket-service/           # Servicio WebSocket
│       ├── index.ts                 # Servidor Socket.io
│       └── package.json
└── db/
    └── custom.db                    # Base de datos SQLite
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Validaciones en todas las APIs
- Sanitización de inputs
- CORS configurado para WebSocket

## 🐛 Troubleshooting

### Error: "ECONNREFUSED" en notificaciones WebSocket

Esto ocurre cuando el servicio WebSocket no está iniciado. El sistema sigue funcionando, pero las actualizaciones serán por polling:

**Solución**: Inicie el servicio WebSocket en una terminal separada:
```bash
cd mini-services/websocket-service
bun run dev
```

### Los turnos no se guardan

Verifique que la base de datos esté configurada correctamente:
```bash
bun run db:push
bun run db:seed
```

### No se pueden crear turnos

Asegúrese de que:
1. La base de datos esté inicializada
2. Los sectores existan y estén activos
3. El formato del DNI sea correcto (solo números)

## 📝 Notas de Desarrollo

El sistema está completo y funcional. Los componentes principales son:
- ✅ Base de datos con Prisma
- ✅ Tres interfaces funcionales
- ✅ APIs REST completas
- ✅ Sistema de notificaciones
- ✅ Diseño responsive y profesional

Para ver el progreso detallado del desarrollo, revise el archivo `worklog.md`.

## 📄 Licencia

Este proyecto es parte del ecosistema Z.ai y está disponible para uso educativo y comercial.
