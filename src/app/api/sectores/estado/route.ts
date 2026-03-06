import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sectorId, operadorId, cerradoManualmente } = body

    if (!sectorId || !operadorId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el operador tiene permiso para controlar este sector
    const operadorSector = await db.operadorSector.findFirst({
      where: {
        operadorId,
        sectorId,
        puedeControlarTurnos: true
      }
    })

    if (!operadorSector) {
      return NextResponse.json(
        { error: 'No tiene permisos para controlar este sector' },
        { status: 403 }
      )
    }

    // Actualizar el estado del sector
    const sector = await db.sector.update({
      where: { id: sectorId },
      data: { cerradoManualmente }
    })

    // Notificar via WebSocket al totem
    try {
      await fetch('http://localhost:3003/notify/sector-estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorId: sector.id,
          nombre: sector.nombre,
          cerradoManualmente: sector.cerradoManualmente
        })
      })
    } catch (wsError) {
      console.error('Error notificando websocket:', wsError)
      // No fallar la operación si el websocket no está disponible
    }

    return NextResponse.json({
      success: true,
      sector: {
        id: sector.id,
        nombre: sector.nombre,
        cerradoManualmente: sector.cerradoManualmente
      }
    })
  } catch (error) {
    console.error('Error al cambiar estado del sector:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = searchParams.get('operadorId')

    if (!operadorId) {
      return NextResponse.json(
        { error: 'Falta el ID del operador' },
        { status: 400 }
      )
    }

    // Obtener sectores que el operador puede controlar
    const sectoresControl = await db.operadorSector.findMany({
      where: {
        operadorId,
        puedeControlarTurnos: true
      },
      include: {
        sector: {
          select: {
            id: true,
            nombre: true,
            color: true,
            cerradoManualmente: true,
            horarios: true
          }
        }
      }
    })

    return NextResponse.json(sectoresControl.map(sc => sc.sector))
  } catch (error) {
    console.error('Error al obtener sectores del operador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
