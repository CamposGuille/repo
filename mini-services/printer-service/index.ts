import { createServer } from 'http'
import { usb } from 'usb'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PORT = 3004
const USE_SYSTEM_PRINTER = true // Usar impresora predeterminada del sistema

// ESC/POS Commands
const ESC = '\x1B'
const GS = '\x1D'

const ESCPOS_COMMANDS = {
  // Initialize printer
  INIT: ESC + '@',
  // Line feed
  LF: '\x0A',
  // Cut paper (partial)
  CUT_PAPER: GS + 'V' + '\x41' + '\x03',
  // Align center
  ALIGN_CENTER: ESC + '\x61' + '\x01',
  // Align left
  ALIGN_LEFT: ESC + '\x61' + '\x00',
  // Align right
  ALIGN_RIGHT: ESC + '\x61' + '\x02',
  // Bold on
  BOLD_ON: ESC + '\x45' + '\x01',
  // Bold off
  BOLD_OFF: ESC + '\x45' + '\x00',
  // Double width on
  DOUBLE_WIDTH_ON: ESC + '\x21' + '\x30',
  // Double width off
  DOUBLE_WIDTH_OFF: ESC + '\x21' + '\x00',
  // Underline on
  UNDERLINE_ON: ESC + '\x2D' + '\x01',
  // Underline off
  UNDERLINE_OFF: ESC + '\x2D' + '\x00',
}

interface PrinterDevice {
  vendorId: number
  productId: number
  device?: any
}

// Store for detected printers
let printers: PrinterDevice[] = []
let selectedPrinter: PrinterDevice | null = null

// Detect USB printers
function detectPrinters() {
  console.log('🔍 Buscando impresoras USB...')
  const devices = usb.getDeviceList()

  // Common printer vendors (can be extended)
  const printerVendors = [
    0x04B8, // Epson
    0x0519, // Star Micronics
    0x0456, // 3nStar (if registered)
    0x0416, // Winbond
    0x05FE, // HP
  ]

  printers = devices
    .filter(device => {
      // Filter by device class (printer is 0x07)
      // Or by known vendor IDs
      const descriptor = device.deviceDescriptor
      return (
        descriptor.bDeviceClass === 0x07 ||
        printerVendors.includes(descriptor.idVendor) ||
        descriptor.iProduct?.toLowerCase().includes('printer') ||
        descriptor.iManufacturer?.toLowerCase().includes('printer')
      )
    })
    .map(device => ({
      vendorId: device.deviceDescriptor.idVendor,
      productId: device.deviceDescriptor.idProduct,
    }))

  console.log(`🖨️  Encontradas ${printers.length} impresoras:`)
  printers.forEach((p, i) => {
    console.log(`   ${i + 1}. Vendor: 0x${p.vendorId.toString(16).padStart(4, '0').toUpperCase()}, Product: 0x${p.productId.toString(16).padStart(4, '0').toUpperCase()}`)
  })

  // Auto-select first printer if only one found
  if (printers.length === 1) {
    selectedPrinter = printers[0]
    console.log(`✅ Impresora seleccionada automáticamente`)
  }
}

// Open connection to printer
function openPrinter(printer: PrinterDevice): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const device = usb.findByIds(printer.vendorId, printer.productId)

      if (!device) {
        reject(new Error('Impresora no encontrada'))
        return
      }

      device.open()

      // Find interface with endpoints (usually interface 0)
      const interfaces = device.interfaces
      let selectedInterface = null

      for (const iface of interfaces) {
        if (iface.endpoints.length > 0) {
          selectedInterface = iface
          break
        }
      }

      if (!selectedInterface) {
        device.close()
        reject(new Error('No se encontró interfaz válida'))
        return
      }

      selectedInterface.claim()
      printer.device = device

      console.log('✅ Impresora conectada')
      resolve(device)
    } catch (error) {
      console.error('❌ Error al conectar impresora:', error)
      reject(error)
    }
  })
}

// Close printer connection
function closePrinter() {
  if (selectedPrinter?.device) {
    try {
      selectedPrinter.device.close()
      console.log('🔌 Impresora desconectada')
    } catch (error) {
      console.error('Error al desconectar impresora:', error)
    }
    selectedPrinter.device = undefined
  }
}

// Send data to printer
function sendToPrinter(data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!selectedPrinter?.device) {
      reject(new Error('No hay impresora seleccionada'))
      return
    }

    try {
      const device = selectedPrinter.device
      const interfaces = device.interfaces

      // Find first endpoint to write to
      for (const iface of interfaces) {
        if (iface.isClaimed) {
          const endpoints = iface.endpoints
          for (const endpoint of endpoints) {
            if (endpoint.direction === 'out') {
              const buffer = Buffer.from(data, 'latin1')
              endpoint.transfer(buffer, (error: any) => {
                if (error) {
                  reject(error)
                } else {
                  resolve()
                }
              })
              return
            }
          }
        }
      }

      reject(new Error('No se encontró endpoint de escritura'))
    } catch (error) {
      reject(error)
    }
  })
}

// Build ESC/POS ticket data
function buildTicket(data: any): string {
  let ticket = ESCPOS_COMMANDS.INIT

  // Header
  ticket += ESCPOS_COMMANDS.ALIGN_CENTER
  ticket += ESCPOS_COMMANDS.DOUBLE_WIDTH_ON
  ticket += ESCPOS_COMMANDS.BOLD_ON
  ticket += data.title || 'TICKET\n'
  ticket += ESCPOS_COMMANDS.BOLD_OFF
  ticket += ESCPOS_COMMANDS.DOUBLE_WIDTH_OFF
  ticket += '\n'

  ticket += ESCPOS_COMMANDS.UNDERLINE_ON
  ticket += '================================\n'
  ticket += ESCPOS_COMMANDS.UNDERLINE_OFF
  ticket += '\n'

  // Custom content
  if (data.content) {
    ticket += ESCPOS_COMMANDS.ALIGN_LEFT
    ticket += data.content
    ticket += '\n'
  }

  // Turno information
  if (data.turno) {
    ticket += ESCPOS_COMMANDS.ALIGN_CENTER
    ticket += ESCPOS_COMMANDS.BOLD_ON
    ticket += '\n'
    ticket += 'TURNO: ' + data.turno.numero + '\n'
    ticket += ESCPOS_COMMANDS.BOLD_OFF
    ticket += '\n'

    if (data.turno.sector) {
      ticket += 'Sector: ' + data.turno.sector + '\n'
    }

    if (data.turno.fecha) {
      ticket += 'Fecha: ' + data.turno.fecha + '\n'
    }

    if (data.turno.hora) {
      ticket += 'Hora: ' + data.turno.hora + '\n'
    }

    ticket += '\n'
  }

  // Footer
  ticket += ESCPOS_COMMANDS.ALIGN_CENTER
  ticket += ESCPOS_COMMANDS.UNDERLINE_ON
  ticket += '================================\n'
  ticket += ESCPOS_COMMANDS.UNDERLINE_OFF
  ticket += '\n'

  if (data.footer) {
    ticket += data.footer
    ticket += '\n'
  }

  ticket += '\n'
  ticket += '\n'
  ticket += '\n'
  ticket += ESCPOS_COMMANDS.CUT_PAPER

  return ticket
}

// Print using system default printer (via CUPS or Windows)
async function printWithSystemPrinter(ticketData: string): Promise<void> {
  try {
    // Crear un archivo temporal con el contenido del ticket
    const fs = await import('fs')
    const os = await import('os')
    const path = await import('path')

    const tmpDir = os.tmpdir()
    const ticketFile = path.join(tmpDir, `ticket_${Date.now()}.txt`)
    const buffer = Buffer.from(ticketData, 'latin1')

    await fs.promises.writeFile(ticketFile, buffer)
    console.log(`📄 Ticket guardado en: ${ticketFile}`)

    // Detectar sistema operativo
    const platform = process.platform

    if (platform === 'linux') {
      // Usar CUPS en Linux
      console.log('🖨️  Intentando imprimir con CUPS (impresora predeterminada)...')
      try {
        await execAsync(`lp -o raw ${ticketFile}`)
        console.log('✅ Impresión enviada a CUPS')
      } catch (error) {
        console.log('⚠️  CUPS no disponible, guardando ticket en archivo (modo desarrollo)')

        // Guardar en directorio del proyecto para revisión
        const fs = await import('fs')
        const path = await import('path')

        const ticketsDir = path.join(process.cwd(), 'tickets-generados')
        await fs.promises.mkdir(ticketsDir, { recursive: true })

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const devTicketFile = path.join(ticketsDir, `ticket_${timestamp}.txt`)
        await fs.promises.writeFile(devTicketFile, buffer)

        console.log(`✅ Ticket guardado para revisión: ${devTicketFile}`)
        console.log(`   NOTA: En producción con impresora real, esto imprimirá en la impresora predeterminada`)
      }
    } else if (platform === 'win32') {
      // Usar impresora predeterminada en Windows
      console.log('🖨️  Imprimiendo en Windows (impresora predeterminada)...')

      // Enviar el archivo a la impresora predeterminada de Windows usando PowerShell
      await execAsync(`powershell -Command "Get-Content -Path '${ticketFile}' | Out-Printer -Default"`)
      console.log('✅ Impresión enviada en Windows')
    } else {
      throw new Error(`Sistema operativo no soportado: ${platform}`)
    }

    // Limpiar archivo temporal después de un pequeño delay
    setTimeout(() => {
      fs.unlink(ticketFile, (err) => {
        if (err) console.error('Error al eliminar archivo temporal:', err)
      })
    }, 1000)
  } catch (error: any) {
    console.error('❌ Error al imprimir con impresora del sistema:', error)
    throw new Error(`Error al imprimir: ${error.message}`)
  }
}

// Initialize
detectPrinters()

// HTTP Server
const httpServer = createServer()

httpServer.on('request', async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const pathname = url.pathname

  // Health check
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      success: true,
      printers: printers.length,
      selected: selectedPrinter ? {
        vendorId: selectedPrinter.vendorId,
        productId: selectedPrinter.productId,
      } : null,
      systemPrinter: USE_SYSTEM_PRINTER,
    }))
    return
  }

  // List printers
  if (pathname === '/api/impresoras' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      printers,
      selected: selectedPrinter ? printers.indexOf(selectedPrinter) : -1,
    }))
    return
  }

  // Select printer
  if (pathname === '/api/impresoras/seleccionar' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => body += chunk.toString())
    req.on('end', () => {
      try {
        const { index } = JSON.parse(body || '{}')
        if (index >= 0 && index < printers.length) {
          selectedPrinter = printers[index]
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, selected: index }))
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Índice de impresora inválido' }))
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Error en solicitud' }))
      }
    })
    return
  }

  // Print ticket
  if (pathname === '/api/imprimir' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => body += chunk.toString())
    req.on('end', async () => {
      try {
        const ticketData = JSON.parse(body || '{}')

        // Build ticket with ESC/POS commands
        const ticket = buildTicket(ticketData)

        // Try to print with USB printer if available
        if (selectedPrinter) {
          // Open printer if not already connected
          if (!selectedPrinter.device) {
            await openPrinter(selectedPrinter)
          }

          // Send to printer
          await sendToPrinter(ticket)
          console.log('🖨️  Ticket impreso (USB):', ticketData.turno?.numero || '(sin número)')
        } else if (USE_SYSTEM_PRINTER) {
          // Use system default printer
          await printWithSystemPrinter(ticket)
          console.log('🖨️  Ticket impreso (Sistema):', ticketData.turno?.numero || '(sin número)')
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'No hay impresora disponible' }))
          return
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      } catch (error: any) {
        console.error('❌ Error al imprimir:', error)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: error.message || 'Error al imprimir' }))
      }
    })
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

httpServer.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║   SERVICIO DE IMPRESIÓN LOCAL - TÓTEM         ║')
  console.log('╚════════════════════════════════════════════════╝')
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`)
  console.log(``)
  console.log(`📡 Endpoints disponibles:`)
  console.log(`   GET  /health               - Estado del servicio`)
  console.log(`   GET  /api/impresoras       - Listar impresoras`)
  console.log(`   POST /api/impresoras/seleccionar - Seleccionar impresora`)
  console.log(`   POST /api/imprimir         - Imprimir ticket`)
  console.log(``)
  console.log(`📝 Ejemplo de uso:`)
  console.log(`   curl -X POST http://localhost:${PORT}/api/imprimir \\`)
  console.log(`     -H "Content-Type: application/json" \\`)
  console.log(`     -d '{"title":"TICKET","turno":{"numero":"A001","sector":"Farmacia"}}'`)
  console.log(``)
  console.log(`🖨️  Impresora del sistema: ${USE_SYSTEM_PRINTER ? 'ACTIVADA' : 'Desactivada'}`)
})
