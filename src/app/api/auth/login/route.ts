import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'

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

    // Primero buscar en Admin (para panel de administración)
    let admin = await db.admin.findUnique({
      where: { username }
    })

    // Si no es admin, buscar en Operador (para atender clientes)
    let usuario = null
    let esAdmin = false
    if (!admin) {
      usuario = await db.operador.findUnique({
        where: { username },
        include: {
          sectores: {
            include: {
              sector: true
            }
          }
        }
      })
      if (usuario) {
        esAdmin = false
      }
    }

    if (!admin && !usuario) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Verificar si está activo
    const usuarioActivo = admin ? admin : usuario
    if (!usuarioActivo.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, usuarioActivo.password)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Retornar datos del usuario sin la contraseña y con indicador si es admin
    const { password: _, ...usuarioSinPassword } = usuarioActivo

    return NextResponse.json({
      ...usuarioSinPassword,
      esAdmin,
      sectores: usuarioActivo.sectores
    })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error en el login' },
      { status: 500 }
    )
  }
}
