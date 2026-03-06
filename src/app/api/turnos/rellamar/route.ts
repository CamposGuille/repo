import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifyTurnoLlamado } from '@/lib/websocket/notify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { turnoId } = body

    // Validar datos
    if (!turnoId) {
      return NextResponse.json(
        { error: 'Turno ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener el turno actual
    const turno = await db.turno.findUnique({
      where: { id: turnoId },
      include: {
        sector: true,
        operador: true,
        box: true
      }
    })

    if (!turno) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el turno esté en estado "llamado" o "atendiendo"
    if (turno.estado !== 'llamado' && turno.estado !== 'atendiendo') {
      return NextResponse.json(
        { error: 'El turno no está activo' },
        { status: 400 }
      )
    }

    // Notificar vía WebSocket (sin cambiar el estado)
    notifyTurnoLlamado(turno)

    return NextResponse.json({ 
      success: true, 
      message: 'Turno re-llamado correctamente',
      turno 
    })
  } catch (error) {
    console.error('Error al re-llamar turno:', error)
    return NextResponse.json(
      { error: 'Error al re-llamar turno' },
      { status: 500 }
    )
  }
}
