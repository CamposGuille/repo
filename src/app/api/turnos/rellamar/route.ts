import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { turnoId } = body

    if (!turnoId) {
      return NextResponse.json(
        { error: 'Turno ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener el turno actual
    const turnoExistente = await db.turno.findUnique({
      where: { id: turnoId }
    })

    if (!turnoExistente) {
      return NextResponse.json(
        { error: 'Turno no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el turno esté en estado "llamado" o "atendiendo"
    if (turnoExistente.estado !== 'llamado' && turnoExistente.estado !== 'atendiendo') {
      return NextResponse.json(
        { error: 'El turno no está activo' },
        { status: 400 }
      )
    }

    // Actualizar la fecha de llamado a ahora (para que el monitor detecte el re-llamado)
    const turno = await db.turno.update({
      where: { id: turnoId },
      data: {
        fechaLlamado: new Date()
      },
      include: {
        sector: true,
        operador: true,
        box: true
      }
    })

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
