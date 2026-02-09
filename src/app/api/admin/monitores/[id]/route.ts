import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener un monitor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsId = (await params).id

    const monitor = await db.monitor.findUnique({
      where: { id: paramsId },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsId = (await params).id
    const body = await request.json()
    const { nombre, descripcion, activo, sectorIds } = body

    // Validar que el monitor existe
    const monitorExistente = await db.monitor.findUnique({
      where: { id: paramsId },
      include: {
        sectores: {
          include: {
            sector: true
          }
        }
      }
    })

    if (!monitorExistente) {
      return NextResponse.json(
        { error: 'Monitor no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {
      nombre: nombre || monitorExistente.nombre,
      descripcion: descripcion !== undefined ? descripcion : monitorExistente.descripcion
    }

    if (activo !== undefined) {
      updateData.activo = activo
    }

    // Manejar la actualización de sectores
    if (sectorIds !== undefined) {
      // Primero eliminar todas las relaciones existentes
      await db.monitorSector.deleteMany({
        where: {
          monitorId: paramsId
        }
      })

      // Si hay nuevos sectores, crear las relaciones
      if (sectorIds.length > 0) {
        updateData.sectores = {
          create: sectorIds.map((sectorId: string) => ({
            sector: { connect: { id: sectorId } }
          }))
        }
      }
    }

    // Actualizar monitor
    const monitor = await db.monitor.update({
      where: { id: paramsId },
      data: updateData,
      include: {
        sectores: {
          include: {
            sector: true
          }
        }
      }
    })

    return NextResponse.json(monitor)
  } catch (error) {
    console.error('Error al actualizar monitor:', error)
    return NextResponse.json(
      { error: 'Error al actualizar monitor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsId = (await params).id

    // Validar que el monitor existe
    const monitor = await db.monitor.findUnique({
      where: { id: paramsId },
      include: {
        sectores: true
      }
    })

    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar monitor (las relaciones se eliminan en cascada)
    await db.monitor.delete({
      where: { id: paramsId }
    })

    return NextResponse.json({ message: 'Monitor eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar monitor:', error)
    return NextResponse.json(
      { error: 'Error al eliminar monitor' },
      { status: 500 }
    )
  }
}
