import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar todos los boxes
export async function GET() {
  try {
    const boxes = await db.box.findMany({
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
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Transformar la respuesta para facilitar el uso en el frontend
    const boxesFormateados = boxes.map(box => ({
      id: box.id,
      nombre: box.nombre,
      descripcion: box.descripcion,
      activo: box.activo,
      createdAt: box.createdAt,
      updatedAt: box.updatedAt,
      operadores: box.operadores.map(ob => ob.operador)
    }))

    return NextResponse.json(boxesFormateados)
  } catch (error) {
    console.error('Error al obtener boxes:', error)
    return NextResponse.json(
      { error: 'Error al obtener boxes' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo box
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { nombre, descripcion, operadorIds } = data

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del box es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un box con ese nombre
    const boxExistente = await db.box.findUnique({
      where: { nombre: nombre.trim() }
    })

    if (boxExistente) {
      return NextResponse.json(
        { error: 'Ya existe un box con ese nombre' },
        { status: 400 }
      )
    }

    // Crear el box con los operadores asignados
    const box = await db.box.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        operadores: operadorIds && operadorIds.length > 0 ? {
          create: operadorIds.map((operadorId: string) => ({
            operadorId
          }))
        } : undefined
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
    console.error('Error al crear box:', error)
    return NextResponse.json(
      { error: 'Error al crear box' },
      { status: 500 }
    )
  }
}
