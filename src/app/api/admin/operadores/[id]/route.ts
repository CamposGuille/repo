import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsId = (await params).id
    const body = await request.json()
    const { username, password, nombre, sectorIds, activo } = body

    const operadorExistente = await db.operador.findUnique({
      where: { id: paramsId },
      include: {
        sectores: true
      }
    })

    if (!operadorExistente) {
      return NextResponse.json({ error: 'Operador no encontrado' }, { status: 404 })
    }

    if (username && username !== operadorExistente.username) {
      const usernameExiste = await db.operador.findUnique({ where: { username } })
      if (usernameExiste) {
        return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 })
      }
    }

    // Si se proporcionan sectorIds, validar que existan
    if (sectorIds && sectorIds.length > 0) {
      for (const sectorId of sectorIds) {
        const sector = await db.sector.findUnique({ where: { id: sectorId } })
        if (!sector) {
          return NextResponse.json({ error: 'Uno o más sectores no encontrados' }, { status: 404 })
        }
      }
    }

    const updateData: any = {
      nombre: nombre || operadorExistente.nombre,
      activo: activo !== undefined ? activo : operadorExistente.activo
    }

    if (username) {
      updateData.username = username
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Manejar la actualización de sectores
    if (sectorIds !== undefined) {
      // Primero eliminar todas las relaciones existentes
      await db.operadorSector.deleteMany({
        where: {
          operadorId: paramsId
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

    const operador = await db.operador.update({
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

    const { password: _, ...result } = operador as any
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al actualizar operador' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paramsId = (await params).id
    const operador = await db.operador.findUnique({ where: { id: paramsId } })

    if (!operador) {
      return NextResponse.json({ error: 'Operador no encontrado' }, { status: 404 })
    }

    await db.operador.delete({ where: { id: paramsId } })
    return NextResponse.json({ message: 'Operador eliminado' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar operador' }, { status: 500 })
  }
}
