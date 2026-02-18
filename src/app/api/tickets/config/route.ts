import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener la configuración activa (default) para imprimir tickets
export async function GET() {
  try {
    const config = await db.ticketConfig.findFirst({
      where: {
        esDefault: true,
        activo: true
      }
    })

    if (!config) {
      // Si no hay configuración default, retornar configuración hardcodeada
      const defaultConfig = {
        papel: {
          ancho: 80,
          alto: 90,
          margen: 10,
        },
        logo: {
          visible: true,
          url: '',
          ancho: 100,
          alto: 60,
          posicion: 'centro',
          margenInferior: 15,
        },
        tituloSector: {
          visible: true,
          tamaño: 22,
          negrita: true,
          posicion: 'centro',
          bordeInferior: true,
          margenInferior: 10,
        },
        numeroTurno: {
          tamaño: 60,
          negrita: true,
          colorFondo: '#000000',
          colorTexto: '#ffffff',
          borderRadius: 15,
          paddingX: 20,
          paddingY: 20,
          margenSuperior: 15,
          margenInferior: 15,
        },
        info: {
          visible: true,
          dni: {
            visible: true,
            etiqueta: 'DNI:',
            tamaño: 14,
          },
          fecha: {
            visible: true,
            etiqueta: 'Fecha:',
            formato: 'dd/mm/yyyy',
            tamaño: 14,
          },
          hora: {
            visible: true,
            etiqueta: 'Hora:',
            formato: '24h',
            tamaño: 14,
          },
          alineacion: 'centro',
          margenSuperior: 15,
          interlineado: 1.8,
        },
        separador: {
          visible: true,
          estilo: 'dashed',
          grosor: 2,
          margenSuperior: 15,
          margenInferior: 15,
        },
        footer: {
          visible: true,
          lineas: ['Espere en la sala a ser llamado', '¡Gracias por su paciencia!'],
          tamaño: 11,
          alineacion: 'centro',
          margenSuperior: 15,
        },
        orden: ['logo', 'tituloSector', 'numeroTurno', 'separador-1', 'info', 'separador-2', 'footer'],
      }

      return NextResponse.json({ config: defaultConfig })
    }

    return NextResponse.json({
      id: config.id,
      nombre: config.nombre,
      config: JSON.parse(config.config)
    })
  } catch (error) {
    console.error('Error al obtener configuración de ticket:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}
