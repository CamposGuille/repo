import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Exportar todos los datos
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        admin: await db.admin.findMany(),
        configuracion: await db.configuracion.findMany(),
        operadores: await db.operador.findMany({
          include: {
            sectores: true,
            boxes: true
          }
        }),
        sectores: await db.sector.findMany(),
        boxes: await db.box.findMany(),
        monitores: await db.monitor.findMany({
          include: {
            sectores: true
          }
        }),
        turnos: await db.turno.findMany(),
        operadorSector: await db.operadorSector.findMany(),
        operadorBox: await db.operadorBox.findMany(),
        monitorSector: await db.monitorSector.findMany(),
        ticketConfig: await db.ticketConfig.findMany(),
        videoMonitor: await db.videoMonitor.findMany()
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al exportar base de datos:', error)
    return NextResponse.json(
      { error: 'Error al exportar base de datos' },
      { status: 500 }
    )
  }
}
