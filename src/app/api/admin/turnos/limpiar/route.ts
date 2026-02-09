import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { estados } = body // Array de estados a limpiar, por defecto: ["llamado", "atendiendo"]

    // Estados por defecto si no se especifican
    const estadosALimpiar = estados && estados.length > 0
      ? estados
      : ['llamado', 'atendiendo']

    // Obtener turnos en esos estados
    const turnos = await db.turno.findMany({
      where: {
        estado: {
          in: estadosALimpiar
        }
      }
    })

    // Eliminar turnos en cascada (las relaciones se eliminan)
    await db.turno.deleteMany({
      where: {
        estado: {
          in: estadosALimpiar
        }
      }
    })

    return NextResponse.json({
      message: 'Turnos limpiados correctamente',
      cantidadEliminada: turnos.length,
      estadosLimpiados: estadosALimpiar
    })
  } catch (error) {
    console.error('Error al limpiar turnos:', error)
    return NextResponse.json(
      { error: 'Error al limpiar turnos' },
      { status: 500 }
    )
  }
}
