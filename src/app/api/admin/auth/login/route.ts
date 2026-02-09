import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validar datos
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el administrador
    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Verificar si está activo
    if (!admin.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, admin.password)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Retornar datos del administrador (sin la contraseña)
    const { password: _, ...adminSinPassword } = admin

    return NextResponse.json(adminSinPassword)
  } catch (error) {
    console.error('Error en login admin:', error)
    return NextResponse.json(
      { error: 'Error en el login' },
      { status: 500 }
    )
  }
}
