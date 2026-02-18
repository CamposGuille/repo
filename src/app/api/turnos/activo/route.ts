import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = searchParams.get('operadorId')

    if (!operadorId) {
      return NextResponse.json(
        { error: 'Operador ID es requerido' },
        { status: 400 }
      )
    }

    // Buscar turno activo del operador (llamado o atendiendo)
    const turno = await db.turno.findFirst({
      where: {
        operadorId,
        estado: {
          in: ['llamado', 'atendiendo']
        }
      },
      include: {
        sector: true
      },
      orderBy: {
        fechaLlamado: 'desc'
      }
    })

    return NextResponse.json({ turno })
  } catch (error) {
    console.error('Error al obtener turno activo:', error)
    return NextResponse.json(
      { error: 'Error al obtener turno activo' },
      { status: 500 }
    )
  }
}
