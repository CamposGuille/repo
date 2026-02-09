import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectorId = searchParams.get('sectorId')

    if (!sectorId) {
      return NextResponse.json(
        { error: 'Sector ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener turnos en espera del sector
    const turnos = await db.turno.findMany({
      where: {
        sectorId,
        estado: 'esperando'
      },
      include: {
        sector: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(turnos)
  } catch (error) {
    console.error('Error al listar turnos:', error)
    return NextResponse.json(
      { error: 'Error al listar turnos' },
      { status: 500 }
    )
  }
}
