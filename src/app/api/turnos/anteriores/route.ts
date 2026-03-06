import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const turnos = await db.turno.findMany({
      where: {
        estado: {
          in: ['ausente', 'finalizado']
        }
      },
      orderBy: {
        fechaCreacion: 'desc'
      },
      take: 12,
      select: {
        id: true,
        numero: true,
        estado: true,
        sector: {
          select: {
            nombre: true,
            color: true
          }
        }
      }
    })

    return NextResponse.json(turnos)
  } catch (error) {
    console.error('Error al obtener turnos anteriores:', error)
    return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 })
  }
}
