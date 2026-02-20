import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params
    const numeroInt = parseInt(numero, 10)

    if (isNaN(numeroInt)) {
      return NextResponse.json(
        { error: 'Número de monitor inválido' },
        { status: 400 }
      )
    }

    const monitor = await db.monitor.findUnique({
      where: { numero: numeroInt },
      include: {
        sectores: {
          include: {
            sector: true
          }
        }
      }
    })

    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(monitor)
  } catch (error) {
    console.error('Error al obtener monitor:', error)
    return NextResponse.json(
      { error: 'Error al obtener monitor' },
      { status: 500 }
    )
  }
}
