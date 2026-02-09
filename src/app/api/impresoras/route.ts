import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Listar impresoras disponibles
export async function GET() {
  try {
    const printers = await db.printer.findMany({})

    return NextResponse.json({ printers })
  } catch (error) {
    console.error('Error al obtener impresoras:', error)
    return NextResponse.json(
      { error: 'Error al obtener impresoras' },
      { status: 500 }
    )
  }
}

// POST: Seleccionar impresora por defecto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { index } = body

    // Buscar la impresora seleccionada
    const config = await db.configuracion.findUnique({
      where: { id: 'default' }
    })

    if (!config || config.selectedPrinter === undefined || config.selectedPrinter === null) {
      return NextResponse.json({
        error: 'No hay impresora seleccionada' },
        { status: 400 }
      })
    }

    // Actualizar la selección
    await db.configuracion.update({
      where: { id: 'default' },
      data: { selectedPrinter: index }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al seleccionar impresora:', error)
    return NextResponse.json(
      { error: 'Error al seleccionar impresora' },
      { status: 500 }
    )
  }
}
