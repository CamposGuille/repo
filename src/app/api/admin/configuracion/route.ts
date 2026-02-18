import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Obtener la configuración
export async function GET() {
  try {
    let configuracion = await db.configuracion.findUnique({
      where: { id: 'default' }
    })

    // Si no existe, crear configuración por defecto
    if (!configuracion) {
      configuracion = await db.configuracion.create({
        data: {
          id: 'default',
          titulo: 'Sistema de Turnos',
          subtitulo: 'Autogestión y atención',
          descripcion: 'Seleccione la opción según su rol',
          totemTitulo: 'Tótem de Autogestión',
          totemDescripcion: 'Para clientes que deseen sacar un turno',
          totemInstrucciones: 'Ingrese su DNI y seleccione el servicio correspondiente',
          monitorTitulo: 'Monitor de Turnos',
          monitorSubtitulo: '',
          monitorPie: '',
          operadorTitulo: 'Panel del Operador',
          operadorInstrucciones: 'Seleccione un sector para comenzar a atender',
          ticketEncabezado: 'TICKET DE TURNO',
          ticketPie: 'Gracias por su espera',
          ticketColorPrimario: '#1e40af',
          ticketMostrarFecha: true,
          ticketMostrarHora: true,
          ticketMostrarOperador: true,
        }
      })
    }

    return NextResponse.json(configuracion)
  } catch (error) {
    console.error('Error al obtener configuración:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar la configuración
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      titulo,
      subtitulo,
      descripcion,
      monitorId,
      totemTitulo,
      totemLogoUrl,
      totemDescripcion,
      totemInstrucciones,
      monitorTitulo,
      monitorSubtitulo,
      monitorPie,
      monitorSonidoUrl,
      operadorTitulo,
      operadorInstrucciones,
      ticketLogoUrl,
      ticketEncabezado,
      ticketPie,
      ticketColorPrimario,
      ticketMostrarFecha,
      ticketMostrarHora,
      ticketMostrarOperador
    } = body

    // Validar datos requeridos
    if (!titulo || !subtitulo || !descripcion) {
      return NextResponse.json(
        { error: 'Los campos principales son requeridos' },
        { status: 400 }
      )
    }

    // Si se proporciona un monitorId, validar que exista
    if (monitorId) {
      const monitor = await db.monitor.findUnique({
        where: { id: monitorId }
      })
      if (!monitor) {
        return NextResponse.json(
          { error: 'Monitor no encontrado' },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      titulo,
      subtitulo,
      descripcion,
      monitorId,
    }

    // Agregar campos opcionales si están presentes
    if (totemTitulo !== undefined) updateData.totemTitulo = totemTitulo
    if (totemLogoUrl !== undefined) updateData.totemLogoUrl = totemLogoUrl
    if (totemDescripcion !== undefined) updateData.totemDescripcion = totemDescripcion
    if (totemInstrucciones !== undefined) updateData.totemInstrucciones = totemInstrucciones
    if (monitorTitulo !== undefined) updateData.monitorTitulo = monitorTitulo
    if (monitorSubtitulo !== undefined) updateData.monitorSubtitulo = monitorSubtitulo
    if (monitorPie !== undefined) updateData.monitorPie = monitorPie
    if (monitorSonidoUrl !== undefined) updateData.monitorSonidoUrl = monitorSonidoUrl
    if (operadorTitulo !== undefined) updateData.operadorTitulo = operadorTitulo
    if (operadorInstrucciones !== undefined) updateData.operadorInstrucciones = operadorInstrucciones
    if (ticketLogoUrl !== undefined) updateData.ticketLogoUrl = ticketLogoUrl
    if (ticketEncabezado !== undefined) updateData.ticketEncabezado = ticketEncabezado
    if (ticketPie !== undefined) updateData.ticketPie = ticketPie
    if (ticketColorPrimario !== undefined) updateData.ticketColorPrimario = ticketColorPrimario
    if (ticketMostrarFecha !== undefined) updateData.ticketMostrarFecha = ticketMostrarFecha
    if (ticketMostrarHora !== undefined) updateData.ticketMostrarHora = ticketMostrarHora
    if (ticketMostrarOperador !== undefined) updateData.ticketMostrarOperador = ticketMostrarOperador

    // Preparar datos de creación
    const createData: any = {
      id: 'default',
      titulo,
      subtitulo,
      descripcion,
      monitorId,
      totemTitulo: totemTitulo || 'Tótem de Autogestión',
      totemLogoUrl: totemLogoUrl || null,
      totemDescripcion: totemDescripcion || 'Para clientes que deseen sacar un turno',
      totemInstrucciones: totemInstrucciones || 'Ingrese su DNI y seleccione el servicio correspondiente',
      monitorTitulo: monitorTitulo || 'Monitor de Turnos',
      monitorSubtitulo: monitorSubtitulo || '',
      monitorPie: monitorPie || '',
      monitorSonidoUrl: monitorSonidoUrl || null,
      operadorTitulo: operadorTitulo || 'Panel del Operador',
      operadorInstrucciones: operadorInstrucciones || 'Seleccione un sector para comenzar a atender',
      ticketLogoUrl: ticketLogoUrl || null,
      ticketEncabezado: ticketEncabezado || 'TICKET DE TURNO',
      ticketPie: ticketPie || 'Gracias por su espera',
      ticketColorPrimario: ticketColorPrimario || '#1e40af',
      ticketMostrarFecha: ticketMostrarFecha !== undefined ? ticketMostrarFecha : true,
      ticketMostrarHora: ticketMostrarHora !== undefined ? ticketMostrarHora : true,
      ticketMostrarOperador: ticketMostrarOperador !== undefined ? ticketMostrarOperador : true,
    }

    const configuracion = await db.configuracion.upsert({
      where: { id: 'default' },
      update: updateData,
      create: createData
    })

    return NextResponse.json(configuracion)
  } catch (error) {
    console.error('Error al actualizar configuración:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}
