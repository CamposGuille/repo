import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener un box por ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const box = await db.box.findUnique({
      where: { id },
      include: {
        operadores: {
          include: {
            operador: {
              select: {
                id: true,
                nombre: true,
                username: true
              }
            }
          }
        }
      }
    })

    if (!box) {
      return NextResponse.json(
        { error: 'Box no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: box.id,
      nombre: box.nombre,
      descripcion: box.descripcion,
      activo: box.activo,
      createdAt: box.createdAt,
      updatedAt: box.updatedAt,
      operadores: box.operadores.map(ob => ob.operador)
    })
  } catch (error) {
    console.error('Error al obtener box:', error)
    return NextResponse.json(
      { error: 'Error al obtener box' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un box
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const data = await request.json()
    const { nombre, descripcion, activo, operadorIds } = data

    // Verificar que el box existe
    const boxExistente = await db.box.findUnique({
      where: { id }
    })

    if (!boxExistente) {
      return NextResponse.json(
        { error: 'Box no encontrado' },
        { status: 404 }
      )
    }

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if (nombre && nombre !== boxExistente.nombre) {
      const boxConMismoNombre = await db.box.findUnique({
        where: { nombre: nombre.trim() }
      })
      if (boxConMismoNombre) {
        return NextResponse.json(
          { error: 'Ya existe un box con ese nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar el box
    const box = await db.box.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        descripcion: descripcion?.trim() || null,
        activo: activo !== undefined ? activo : undefined
      },
      include: {
        operadores: {
          include: {
            operador: {
              select: {
                id: true,
                nombre: true,
                username: true
              }
            }
          }
        }
      }
    })

    // Si se proporcionan operadorIds, actualizar las relaciones
    if (operadorIds !== undefined) {
      // Eliminar todas las relaciones existentes
      await db.operadorBox.deleteMany({
        where: { boxId: id }
      })

      // Crear las nuevas relaciones
      if (operadorIds.length > 0) {
        await db.operadorBox.createMany({
          data: operadorIds.map((operadorId: string) => ({
            boxId: id,
            operadorId
          }))
        })
      }

      // Obtener el box actualizado con las nuevas relaciones
      const boxActualizado = await db.box.findUnique({
        where: { id },
        include: {
          operadores: {
            include: {
              operador: {
                select: {
                  id: true,
                  nombre: true,
                  username: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({
        id: boxActualizado!.id,
        nombre: boxActualizado!.nombre,
        descripcion: boxActualizado!.descripcion,
        activo: boxActualizado!.activo,
        createdAt: boxActualizado!.createdAt,
        updatedAt: boxActualizado!.updatedAt,
        operadores: boxActualizado!.operadores.map(ob => ob.operador)
      })
    }

    return NextResponse.json({
      id: box.id,
      nombre: box.nombre,
      descripcion: box.descripcion,
      activo: box.activo,
      createdAt: box.createdAt,
      updatedAt: box.updatedAt,
      operadores: box.operadores.map(ob => ob.operador)
    })
  } catch (error) {
    console.error('Error al actualizar box:', error)
    return NextResponse.json(
      { error: 'Error al actualizar box' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un box
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Verificar que el box existe
    const box = await db.box.findUnique({
      where: { id }
    })

    if (!box) {
      return NextResponse.json(
        { error: 'Box no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar primero las relaciones con operadores
    await db.operadorBox.deleteMany({
      where: { boxId: id }
    })

    // Actualizar turnos que tienen este box asignado (poner boxId a null)
    await db.turno.updateMany({
      where: { boxId: id },
      data: { boxId: null }
    })

    // Eliminar el box
    await db.box.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Box eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar box:', error)
    return NextResponse.json(
      { error: 'Error al eliminar box' },
      { status: 500 }
    )
  }
}
