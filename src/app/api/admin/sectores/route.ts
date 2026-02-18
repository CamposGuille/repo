import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los sectores
export async function GET() {
  try {
    const sectores = await db.sector.findMany({
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(sectores)
  } catch (error) {
    console.error('Error al listar sectores:', error)
    return NextResponse.json(
      { error: 'Error al listar sectores' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo sector
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, color, horarios } = body

    // Validar datos
    if (!nombre || !color) {
      return NextResponse.json(
        { error: 'Nombre y color son requeridos' },
        { status: 400 }
      )
    }

    // Validar que el nombre no exista
    const sectorExistente = await db.sector.findUnique({
      where: { nombre }
    })

    if (sectorExistente) {
      return NextResponse.json(
        { error: 'El nombre del sector ya existe' },
        { status: 400 }
      )
    }

    // Crear sector
    const sector = await db.sector.create({
      data: {
        nombre,
        color,
        activo: true,
        numeroTurno: 1,
        horarios: horarios || null
      }
    })

    return NextResponse.json(sector, { status: 201 })
  } catch (error) {
    console.error('Error al crear sector:', error)
    return NextResponse.json(
      { error: 'Error al crear sector' },
      { status: 500 }
    )
  }
}
