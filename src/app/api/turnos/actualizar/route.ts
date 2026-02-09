import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifyTurnoActualizado } from '@/lib/websocket/notify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { turnoId, estado } = body

    // Validar datos
    if (!turnoId || !estado) {
      return NextResponse.json(
        { error: 'Turno ID y estado son requeridos' },
        { status: 400 }
      )
    }

    // Validar estado válido
    const estadosValidos = ['esperando', 'llamado', 'atendiendo', 'finalizado', 'ausente']
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      )
    }

    // Preparar datos de actualización según el estado
    const updateData: any = {
      estado
    }

    if (estado === 'atendiendo') {
      updateData.fechaAtencion = new Date()
    } else if (estado === 'finalizado' || estado === 'ausente') {
      updateData.fechaFinalizado = new Date()
    }

    // Actualizar el turno
    const turnoActualizado = await db.turno.update({
      where: { id: turnoId },
      data: updateData,
      include: {
        sector: true,
        operador: true
      }
    })

    // Notificar vía WebSocket
    notifyTurnoActualizado(turnoActualizado)

    return NextResponse.json(turnoActualizado)
  } catch (error) {
    console.error('Error al actualizar turno:', error)
    return NextResponse.json(
      { error: 'Error al actualizar turno' },
      { status: 500 }
    )
  }
}
