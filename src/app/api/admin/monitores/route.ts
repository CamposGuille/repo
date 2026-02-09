import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los monitores
export async function GET() {
  try {
    const monitores = await db.monitor.findMany({
      include: {
        sectores: {
          include: {
            sector: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(monitores)
  } catch (error) {
    console.error('Error al listar monitores:', error)
    return NextResponse.json(
      { error: 'Error al listar monitores' },
      { status: 500 }
    )
  }
}

// POST - Crear monitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, sectorIds } = body

    if (!nombre || !sectorIds || sectorIds.length === 0) {
      return NextResponse.json(
        { error: 'El nombre y al menos un sector son requeridos' },
        { status: 400 }
      )
    }

    const monitor = await db.monitor.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        activo: true,
        sectores: {
          create: sectorIds.map((sectorId: string) => ({
            sector: { connect: { id: sectorId } }
          }))
        }
      }
    })

    return NextResponse.json(monitor)
  } catch (error) {
    console.error('Error al crear monitor:', error)
    return NextResponse.json(
      { error: 'Error al crear monitor' },
      { status: 500 }
    )
  }
}
