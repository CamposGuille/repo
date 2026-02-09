// Notificaciones vía WebSocket para el sistema de turnos
// Archivo creado para soportar notificaciones en tiempo real

interface TurnoData {
  id: string
  numero: string
  dni: string
  sector: {
    id: string
    nombre: string
    color: string
  }
  estado: string
  fechaCreacion: Date
}

interface MonitorData {
  id: string
  nombre: string
  sectores?: any[]
}

// Función para notificar nuevo turno
export function notifyTurnoNuevo(turno: TurnoData) {
  try {
    // Intentar enviar notificación al servicio WebSocket
    // El WebSocket service corre en el puerto 3003
    fetch('http://localhost:3003/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuevo_turno',
        data: turno
      })
    }).catch((error) => {
      console.log('⚠️  WebSocket service no disponible (esto es normal si no está iniciado)')
      console.log('El sistema funcionará con polling en lugar de tiempo real')
    })
  } catch (error) {
    console.log('⚠️  Error al enviar notificación WebSocket:', error)
  }
}

// Función para notificar turno llamado
export function notifyTurnoLlamado(turno: TurnoData, operadorNombre?: string) {
  try {
    fetch('http://localhost:3003/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'turno_llamado',
        data: {
          turno,
          operadorNombre: operadorNombre || turno.operador?.nombre || 'Operador'
        }
      })
    }).catch((error) => {
      console.log('⚠️  WebSocket service no disponible (esto es normal si no está iniciado)')
    })
  } catch (error) {
    console.log('⚠️  Error al enviar notificación WebSocket:', error)
  }
}

// Función para notificar actualización de estado de turno
export function notifyTurnoActualizado(turno: TurnoData) {
  try {
    fetch('http://localhost:3003/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'turno_actualizado',
        data: turno
      })
    }).catch((error) => {
      console.log('⚠️  WebSocket service no disponible (esto es normal si no está iniciado)')
    })
  } catch (error) {
    console.log('⚠️  Error al enviar notificación WebSocket:', error)
  }
}

// Función para notificar al monitor
export function notifyMonitor(data: any) {
  try {
    fetch('http://localhost:3003/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'monitor_actualizado',
        data
      })
    }).catch((error) => {
      console.log('⚠️  WebSocket service no disponible (esto es normal si no está iniciado)')
    })
  } catch (error) {
    console.log('⚠️  Error al enviar notificación WebSocket:', error)
  }
}
