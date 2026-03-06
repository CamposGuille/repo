import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Eliminar todos los turnos
    await db.turno.deleteMany({})
    
    // Resetear los contadores de todos los sectores a 1
    const sectores = await db.sector.findMany()
    
    for (const sector of sectores) {
      await db.sector.update({
        where: { id: sector.id },
        data: { numeroTurno: 1 }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Todos los turnos han sido eliminados y los contadores reiniciados' 
    })
  } catch (error) {
    console.error('Error al reiniciar turnos:', error)
    return NextResponse.json({ error: 'Error al reiniciar turnos' }, { status: 500 })
  }
}
