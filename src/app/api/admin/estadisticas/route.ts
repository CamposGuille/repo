import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Filtro de fechas opcional
    const filtroFecha: any = {}
    if (fechaDesde || fechaHasta) {
      filtroFecha.createdAt = {}
      if (fechaDesde) {
        filtroFecha.createdAt.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        filtroFecha.createdAt.lte = new Date(fechaHasta)
      }
    }

    // Obtener todos los turnos
    const turnos = await db.turno.findMany({
      where: filtroFecha,
      include: {
        sector: true,
        operador: {
          include: {
            sectores: {
              include: {
                sector: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calcular estadísticas por estado
    const turnosPorEstado = {
      esperando: 0,
      llamado: 0,
      atendiendo: 0,
      finalizado: 0,
      ausente: 0
    }

    turnos.forEach(turno => {
      turnosPorEstado[turno.estado as keyof typeof turnosPorEstado]++
    })

    // Calcular estadísticas por sector
    const turnosPorSector = turnos.reduce((acc: any, turno) => {
      const key = turno.sector.nombre
      if (!acc[key]) {
        acc[key] = {
          total: 0,
          finalizados: 0,
          ausentes: 0,
          color: turno.sector.color
        }
      }
      acc[key].total++
      if (turno.estado === 'finalizado') acc[key].finalizados++
      if (turno.estado === 'ausente') acc[key].ausentes++
      return acc
    }, {})

    // Calcular estadísticas por operador
    const turnosPorOperador = turnos.reduce((acc: any, turno) => {
      if (!turno.operador) return acc

      const key = turno.operador.nombre
      if (!acc[key]) {
        acc[key] = {
          total: 0,
          finalizados: 0,
          ausentes: 0
        }
      }
      acc[key].total++
      if (turno.estado === 'finalizado') acc[key].finalizados++
      if (turno.estado === 'ausente') acc[key].ausentes++
      return acc
    }, {})

    // Calcular tiempos promedio
    const tiemposDeEspera = turnos
      .filter(t => t.fechaLlamado)
      .map(t => {
        const llamada = new Date(t.fechaLlamado)
        const creacion = new Date(t.createdAt)
        return (llamada.getTime() - creacion.getTime()) / 1000 // En segundos
      })

    const tiemposDeAtencion = turnos
      .filter(t => t.fechaAtencion && t.fechaFinalizado)
      .map(t => {
        const fin = new Date(t.fechaFinalizado!)
        const inicio = new Date(t.fechaAtencion!)
        return (fin.getTime() - inicio.getTime()) / 1000 // En segundos
      })

    const tiempoEsperaPromedio = tiemposDeEspera.length > 0
      ? tiemposDeEspera.reduce((a, b) => a + b, 0) / tiemposDeEspera.length
      : 0

    const tiempoAtencionPromedio = tiemposDeAtencion.length > 0
      ? tiemposDeAtencion.reduce((a, b) => a + b, 0) / tiemposDeAtencion.length
      : 0

    // Calcular turnos por hora del día
    const turnosPorHora = Array(24).fill(0)
    turnos.forEach(turno => {
      const hora = new Date(turno.createdAt).getHours()
      turnosPorHora[hora]++
    })

    // Calcular turnos por día de la semana
    const turnosPorDia = Array(7).fill(0)
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    turnos.forEach(turno => {
      const dia = new Date(turno.createdAt).getDay()
      turnosPorDia[dia]++
    })

    return NextResponse.json({
      resumen: {
        totalTurnos: turnos.length,
        turnosFinalizados: turnosPorEstado.finalizado,
        turnosAusentes: turnosPorEstado.ausente,
        turnosEnEspera: turnosPorEstado.esperando,
        tiempoEsperaPromedio: Math.round(tiempoEsperaPromedio / 60), // En minutos
        tiempoAtencionPromedio: Math.round(tiempoAtencionPromedio / 60) // En minutos
      },
      porEstado: turnosPorEstado,
      porSector: turnosPorSector,
      porOperador: turnosPorOperador,
      porHora: turnosPorHora,
      porDia: turnosPorDia.map((count, index) => ({
        dia: diasSemana[index],
        count
      })),
      ultimosTurnos: turnos.slice(0, 10)
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
