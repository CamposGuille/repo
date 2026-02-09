import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifyTurnoNuevo } from '@/lib/websocket/notify'

export async function GET() {
  try {
    // Listar sectores activos
    const sectores = await db.sector.findMany({
      where: {
        activo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(sectores)
  } catch (error) {
    console.error('Error al obtener sectores:', error)
    return NextResponse.json(
      { error: 'Error al obtener sectores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dni, sectorId } = body

    // Validar datos
    if (!dni || !sectorId) {
      return NextResponse.json(
        { error: 'DNI y sector son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de DNI (solo números)
    if (!/^\d+$/.test(dni)) {
      return NextResponse.json(
        { error: 'El DNI debe contener solo números' },
        { status: 400 }
      )
    }

    // Obtener el sector
    const sector = await db.sector.findUnique({
      where: { id: sectorId }
    })

    if (!sector) {
      return NextResponse.json(
        { error: 'Sector no encontrado' },
        { status: 404 }
      )
    }

    if (!sector.activo) {
      return NextResponse.json(
        { error: 'El sector no está activo' },
        { status: 400 }
      )
    }

    // Generar número de turno
    // Usar la letra inicial del sector y el número secuencial
    const letra = sector.nombre.charAt(0).toUpperCase()
    const numeroTurno = `${letra}-${String(sector.numeroTurno).padStart(3, '0')}`

    // Crear el turno
    const turno = await db.turno.create({
      data: {
        numero: numeroTurno,
        dni,
        sectorId,
        estado: 'esperando'
      },
      include: {
        sector: true
      }
    })

    // Incrementar el contador de turnos del sector
    await db.sector.update({
      where: { id: sectorId },
      data: {
        numeroTurno: sector.numeroTurno + 1
      }
    })

    // Notificar vía WebSocket
    notifyTurnoNuevo(turno)

    return NextResponse.json(turno, { status: 201 })
  } catch (error) {
    console.error('Error al crear turno:', error)
    return NextResponse.json(
      { error: 'Error al crear turno' },
      { status: 500 }
    )
  }
}
