import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, options } = body

    if (!data) {
      return NextResponse.json({ error: 'No se proporcionaron datos' }, { status: 400 })
    }

    const results = {
      admin: 0,
      configuracion: 0,
      operadores: 0,
      sectores: 0,
      boxes: 0,
      monitores: 0,
      turnos: 0,
      errors: [] as string[]
    }

    // Importar en orden correcto (respetando foreign keys)
    
    // 1. Sectores
    if (data.sectores && options?.sectores !== false) {
      for (const item of data.sectores) {
        try {
          await db.sector.upsert({
            where: { id: item.id },
            update: item,
            create: item
          })
          results.sectores++
        } catch (e: any) {
          results.errors.push(`Sector ${item.nombre}: ${e.message}`)
        }
      }
    }

    // 2. Boxes
    if (data.boxes && options?.boxes !== false) {
      for (const item of data.boxes) {
        try {
          await db.box.upsert({
            where: { id: item.id },
            update: item,
            create: item
          })
          results.boxes++
        } catch (e: any) {
          results.errors.push(`Box ${item.nombre}: ${e.message}`)
        }
      }
    }

    // 3. Operadores
    if (data.operadores && options?.operadores !== false) {
      for (const item of data.operadores) {
        try {
          const { sectores, boxes, ...operadorData } = item
          await db.operador.upsert({
            where: { id: item.id },
            update: operadorData,
            create: operadorData
          })
          results.operadores++
        } catch (e: any) {
          results.errors.push(`Operador ${item.nombre}: ${e.message}`)
        }
      }
    }

    // 4. Monitores
    if (data.monitores && options?.monitores !== false) {
      for (const item of data.monitores) {
        try {
          const { sectores, ...monitorData } = item
          await db.monitor.upsert({
            where: { id: item.id },
            update: monitorData,
            create: monitorData
          })
          results.monitores++
        } catch (e: any) {
          results.errors.push(`Monitor ${item.nombre}: ${e.message}`)
        }
      }
    }

    // 5. Turnos
    if (data.turnos && options?.turnos !== false) {
      for (const item of data.turnos) {
        try {
          await db.turno.upsert({
            where: { id: item.id },
            update: item,
            create: item
          })
          results.turnos++
        } catch (e: any) {
          results.errors.push(`Turno ${item.numero}: ${e.message}`)
        }
      }
    }

    // 6. Configuración
    if (data.configuracion && options?.configuracion !== false) {
      for (const item of data.configuracion) {
        try {
          await db.configuracion.upsert({
            where: { id: item.id },
            update: item,
            create: item
          })
          results.configuracion++
        } catch (e: any) {
          results.errors.push(`Configuración: ${e.message}`)
        }
      }
    }

    // 7. Admin
    if (data.admin && options?.admin !== false) {
      for (const item of data.admin) {
        try {
          await db.admin.upsert({
            where: { id: item.id },
            update: item,
            create: item
          })
          results.admin++
        } catch (e: any) {
          results.errors.push(`Admin ${item.username}: ${e.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Importación completada',
      results
    })
  } catch (error: any) {
    console.error('Error al importar base de datos:', error)
    return NextResponse.json(
      { error: 'Error al importar base de datos', details: error.message },
      { status: 500 }
    )
  }
}
