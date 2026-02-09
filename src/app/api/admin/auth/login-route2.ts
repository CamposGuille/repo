import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { username }
    })

    if (!admin || !admin.activo) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const passwordValid = await bcrypt.compare(password, admin.password)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const { password: _, ...adminSinPassword } = admin
    return NextResponse.json(adminSinPassword)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error en el login' },
      { status: 500 }
    )
  }
}
