import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Obtener turnos activos (llamados y en atención)
    const turnosActivos = await db.turno.findMany({
      where: {
        estado: {
          in: ['llamado', 'atendiendo']
        }
      },
      include: {
        sector: true,
        operador: {
          include: {
            sectores: {
              include: {
                sector: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaLlamado: 'desc'
      }
    })

    return NextResponse.json(turnosActivos)
  } catch (error) {
    console.error('Error al obtener turnos activos:', error)
    return NextResponse.json(
      { error: 'Error al obtener turnos activos' },
      { status: 500 }
    )
  }
}
