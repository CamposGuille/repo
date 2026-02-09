import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

// GET - Listar todos los operadores
export async function GET() {
  try {
    const operadores = await db.operador.findMany({
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

    // No enviar la contraseña en la respuesta
    const operadoresSinPassword = operadores.map(op => {
      const { password, ...resto } = op as any
      return resto
    })

    return NextResponse.json(operadoresSinPassword)
  } catch (error) {
    console.error('Error al listar operadores:', error)
    return NextResponse.json(
      { error: 'Error al listar operadores' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo operador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, nombre, sectorIds, activo } = body

    // Validar datos
    if (!username || !password || !nombre) {
      return NextResponse.json(
        { error: 'Username, password y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Validar que el username no exista
    const operadorExistente = await db.operador.findUnique({
      where: { username }
    })

    if (operadorExistente) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      )
    }

    // Si se proporcionan sectorIds, validar que existan
    if (sectorIds && sectorIds.length > 0) {
      for (const sectorId of sectorIds) {
        const sector = await db.sector.findUnique({
          where: { id: sectorId }
        })

        if (!sector) {
          return NextResponse.json(
            { error: 'Uno o más sectores no encontrados' },
            { status: 404 }
          )
        }
      }
    }

    // Hashear contraseña
    const passwordHashed = await bcrypt.hash(password, 10)

    // Crear operador
    const operador = await db.operador.create({
      data: {
        username,
        password: passwordHashed,
        nombre,
        activo: activo !== undefined ? activo : true,
        sectores: sectorIds && sectorIds.length > 0 ? {
          create: sectorIds.map((sectorId: string) => ({
            sector: { connect: { id: sectorId } }
          }))
        } : undefined
      },
      include: {
        sectores: {
          include: {
            sector: true
          }
        }
      }
    })

    // No enviar la contraseña
    const { password: _, ...operadorSinPassword } = operador as any

    return NextResponse.json(operadorSinPassword, { status: 201 })
  } catch (error) {
    console.error('Error al crear operador:', error)
    return NextResponse.json(
      { error: 'Error al crear operador' },
      { status: 500 }
    )
  }
}
