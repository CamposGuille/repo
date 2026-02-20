import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsId = (await params).id
    const body = await request.json()
    const { nombre, color, activo } = body

    const item = await db.sector.findUnique({ where: { id: paramsId } })

    if (!item) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 })
    }

    if (nombre && nombre !== item.nombre) {
      const existe = await db.sector.findUnique({ where: { nombre } })
      if (existe) {
        return NextResponse.json({ error: 'El nombre ya existe' }, { status: 400 })
      }
    }

    const updateData: any = {
      color: color || item.color,
      activo: activo !== undefined ? activo : item.activo
    }

    if (nombre) {
      updateData.nombre = nombre
    }

    const updated = await db.sector.update({
      where: { id: paramsId },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al actualizar sector' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsId = (await params).id
    const item = await db.sector.findUnique({
      where: { id: paramsId },
      include: { operadores: true, turnos: true }
    })

    if (!item) {
      return NextResponse.json({ error: 'Sector no encontrado' }, { status: 404 })
    }

    if (item.operadores.length > 0 || item.turnos.length > 0) {
      return NextResponse.json({ error: 'No se puede eliminar: tiene datos asociados' }, { status: 400 })
    }

    await db.sector.delete({ where: { id: paramsId } })
    return NextResponse.json({ message: 'Sector eliminado' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar sector' }, { status: 500 })
  }
}
