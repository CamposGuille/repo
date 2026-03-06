import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const ausentes = await db.turno.findMany({
      where: { estado: 'ausente' },
      select: {
        id: true,
        numero: true,
        fechaLlamado: true
      },
      orderBy: { fechaLlamado: 'desc' },
      take: 10
    })

    return NextResponse.json(ausentes)
  } catch (error) {
    console.error('Error al obtener ausentes:', error)
    return NextResponse.json({ error: 'Error al obtener ausentes' }, { status: 500 })
  }
}
