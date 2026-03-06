import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const info = {
      tables: {
        admin: await db.admin.count(),
        configuracion: await db.configuracion.count(),
        operadores: await db.operador.count(),
        sectores: await db.sector.count(),
        boxes: await db.box.count(),
        monitores: await db.monitor.count(),
        turnos: await db.turno.count(),
        operadorSector: await db.operadorSector.count(),
        operadorBox: await db.operadorBox.count(),
        monitorSector: await db.monitorSector.count(),
        ticketConfig: await db.ticketConfig.count(),
        videoMonitor: await db.videoMonitor.count()
      },
      turnosPorEstado: {
        esperando: await db.turno.count({ where: { estado: 'esperando' } }),
        llamado: await db.turno.count({ where: { estado: 'llamado' } }),
        atendiendo: await db.turno.count({ where: { estado: 'atendiendo' } }),
        finalizado: await db.turno.count({ where: { estado: 'finalizado' } }),
        ausente: await db.turno.count({ where: { estado: 'ausente' } })
      }
    }

    return NextResponse.json(info)
  } catch (error) {
    console.error('Error al obtener información de base de datos:', error)
    return NextResponse.json(
      { error: 'Error al obtener información de base de datos' },
      { status: 500 }
    )
  }
}
