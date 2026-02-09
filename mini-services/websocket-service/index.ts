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
