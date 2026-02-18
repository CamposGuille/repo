import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener una configuración específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const config = await db.ticketConfig.findUnique({
      where: { id }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error al obtener configuración:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una configuración
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nombre, descripcion, config, esDefault } = body

    // Verificar que existe
    const existing = await db.ticketConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    // Si es default, quitar el flag de las otras
    if (esDefault) {
      await db.ticketConfig.updateMany({
        where: { esDefault: true, NOT: { id } },
        data: { esDefault: false }
      })
    }

    const updatedConfig = await db.ticketConfig.update({
      where: { id },
      data: {
        nombre: nombre || existing.nombre,
        descripcion: descripcion !== undefined ? descripcion : existing.descripcion,
        esDefault: esDefault !== undefined ? esDefault : existing.esDefault,
        config: config ? JSON.stringify(config) : existing.config
      }
    })

    return NextResponse.json(updatedConfig)
  } catch (error: any) {
    console.error('Error al actualizar configuración:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una configuración con ese nombre' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una configuración
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar que existe
    const existing = await db.ticketConfig.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Configuración no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar la configuración default
    if (existing.esDefault) {
      return NextResponse.json(
        { error: 'No se puede eliminar la configuración por defecto' },
        { status: 400 }
      )
    }

    await db.ticketConfig.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar configuración:', error)
    return NextResponse.json(
      { error: 'Error al eliminar configuración' },
      { status: 500 }
    )
  }
}
