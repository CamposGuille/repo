import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifyTurnoLlamado } from '@/lib/websocket/notify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { turnoId, operadorId, boxId } = body

    // Validar datos
    if (!turnoId || !operadorId) {
      return NextResponse.json(
        { error: 'Turno ID y Operador ID son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el operador ya tiene un turno activo (llamado o atendiendo)
    const turnoActivoExistente = await db.turno.findFirst({
      where: {
        operadorId,
        estado: {
          in: ['llamado', 'atendiendo']
        }
      },
      include: {
        sector: true
      }
    })

    if (turnoActivoExistente) {
      return NextResponse.json(
        { 
          error: 'Ya tiene un turno activo sin finalizar',
          turnoActivo: {
            id: turnoActivoExistente.id,
            numero: turnoActivoExistente.numero,
            estado: turnoActivoExistente.estado
          }
        },
        { status: 400 }
      )
    }

    // Obtener el turno
    const turno = await db.turno.findUnique({
      where: { id: turnoId },
      include: {
        sector: true
      }
    })

    if (!turno) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    // Si se proporciona boxId, validar que exista
    if (boxId) {
      const box = await db.box.findUnique({
        where: { id: boxId }
      })
      if (!box) {
        return NextResponse.json(
          { error: 'Box no encontrado' },
          { status: 404 }
        )
      }
    }

    // Actualizar el turno a "llamado"
    const turnoActualizado = await db.turno.update({
      where: { id: turnoId },
      data: {
        estado: 'llamado',
        operadorId,
        boxId: boxId || null,
        fechaLlamado: new Date()
      },
      include: {
        sector: true,
        operador: true,
        box: true
      }
    })

    // Notificar vía WebSocket
    notifyTurnoLlamado(turnoActualizado)

    return NextResponse.json(turnoActualizado)
  } catch (error) {
    console.error('Error al llamar turno:', error)
    return NextResponse.json(
      { error: 'Error al llamar turno' },
      { status: 500 }
    )
  }
}
