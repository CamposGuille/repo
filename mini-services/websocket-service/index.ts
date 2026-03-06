import { Server } from 'socket.io'
import { createServer } from 'http'

const PORT = 3003
const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

console.log(`🔌 WebSocket Server iniciado en puerto ${PORT}`)

// Almacenar sectores conectados y sus estados de horario
interface SectorHorario {
  id: string
  horarios: { inicio: string; fin: string }[]
  activo: boolean
}

const sectoresEstado: Map<string, SectorHorario> = new Map()

// Función para verificar si un sector está en horario activo
const verificarHorarioSector = (horarios: { inicio: string; fin: string }[]): boolean => {
  if (!horarios || horarios.length === 0) return true // Sin horarios = siempre activo

  const ahora = new Date()
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes()

  for (const horario of horarios) {
    const [horaInicio, minInicio] = horario.inicio.split(':').map(Number)
    const [horaFin, minFin] = horario.fin.split(':').map(Number)
    
    const inicioMinutos = horaInicio * 60 + minInicio
    const finMinutos = horaFin * 60 + minFin

    if (horaActual >= inicioMinutos && horaActual <= finMinutos) {
      return true
    }
  }

  return false
}

// Función para verificar todos los sectores y notificar cambios
const verificarTodosLosHorarios = () => {
  const cambios: { sectorId: string; activo: boolean }[] = []
  
  sectoresEstado.forEach((sector, sectorId) => {
    const nuevoEstado = verificarHorarioSector(sector.horarios)
    if (sector.activo !== nuevoEstado) {
      sector.activo = nuevoEstado
      cambios.push({ sectorId, activo: nuevoEstado })
    }
  })

  if (cambios.length > 0) {
    io.to('totem').emit('horarios-actualizados', cambios)
    console.log(`⏰ Cambios de horario detectados: ${cambios.length} sectores actualizados`)
  }
}

// Scheduler: verificar horarios cada minuto
setInterval(verificarTodosLosHorarios, 60000)

// Manejo de conexiones Socket.io
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`)

  // Unirse a una sala específica (ej: sector)
  socket.on('join-sector', (sectorId: string) => {
    socket.join(`sector-${sectorId}`)
    console.log(`📍 Cliente ${socket.id} se unió al sector ${sectorId}`)
  })

  // Dejar una sala
  socket.on('leave-sector', (sectorId: string) => {
    socket.leave(`sector-${sectorId}`)
    console.log(`🚪 Cliente ${socket.id} dejó el sector ${sectorId}`)
  })

  // Unirse al monitor
  socket.on('join-monitor', () => {
    socket.join('monitor')
    console.log(`📺 Cliente ${socket.id} se unió al monitor`)
  })

  // Unirse al totem
  socket.on('join-totem', () => {
    socket.join('totem')
    console.log(`🎫 Cliente ${socket.id} se unió al totem`)
  })

  // Registrar sectores del totem para verificación de horarios
  socket.on('registrar-sectores', (sectores: { id: string; horarios: { inicio: string; fin: string }[] }[]) => {
    sectores.forEach(sector => {
      const existente = sectoresEstado.get(sector.id)
      if (!existente) {
        sectoresEstado.set(sector.id, {
          id: sector.id,
          horarios: sector.horarios,
          activo: verificarHorarioSector(sector.horarios)
        })
      } else {
        existente.horarios = sector.horarios
      }
    })
    console.log(`📋 Sectores registrados para horarios: ${sectores.length}`)
  })

  // Desconexión
  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`)
  })
})

// Servidor HTTP para recibir notificaciones de las APIs
httpServer.on('request', async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const pathname = url.pathname

  // Manejar diferentes tipos de notificaciones
  let body = ''

  req.on('data', (chunk) => {
    body += chunk.toString()
  })

  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}')

      switch (pathname) {
        case '/notify/turno-nuevo':
          io.emit('turno-nuevo', data)
          console.log(`📢 Nuevo turno broadcast: ${data.numero}`)
          break

        case '/notify/turno-llamado':
          io.emit('turno-llamado', data)
          io.to(`sector-${data.sectorId}`).emit('turno-sector-llamado', data)
          io.to('monitor').emit('monitor-turno-llamado', data)
          console.log(`📢 Turno llamado broadcast: ${data.numero}`)
          break

        case '/notify/turno-actualizado':
          io.emit('turno-actualizado', data)
          io.to('monitor').emit('monitor-turno-actualizado', data)
          console.log(`📢 Turno actualizado broadcast: ${data.numero} - ${data.estado}`)
          break

        case '/notify/sector-estado':
          // Notificar al totem que un sector cambió de estado
          io.to('totem').emit('sector-estado-cambiado', data)
          console.log(`📢 Sector estado cambiado: ${data.sectorId} - cerrado: ${data.cerradoManualmente}`)
          break

        default:
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not found' }))
          return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (error) {
      console.error('Error procesando notificación:', error)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Server escuchando en puerto ${PORT}`)
  console.log(`   WebSocket: ws://localhost:${PORT}`)
  console.log(`   HTTP API: http://localhost:${PORT}/notify/*`)
})
