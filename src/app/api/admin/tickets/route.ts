import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Configuración por defecto del ticket (actual)
const DEFAULT_TICKET_CONFIG = {
  // Tamaño del papel
  papel: {
    ancho: 80, // mm
    alto: 90, // mm
    margen: 10, // mm
  },
  // Logo
  logo: {
    visible: true,
    url: '',
    ancho: 100, // px
    alto: 60, // px
    posicion: 'centro', // izquierda, centro, derecha
    margenInferior: 15, // px
  },
  // Título del sector
  tituloSector: {
    visible: true,
    tamaño: 22, // px
    negrita: true,
    posicion: 'centro',
    bordeInferior: true,
    margenInferior: 10, // px
  },
  // Número de turno
  numeroTurno: {
    tamaño: 60, // px
    negrita: true,
    colorFondo: '#000000',
    colorTexto: '#ffffff',
    borderRadius: 15, // px
    paddingX: 20, // px
    paddingY: 20, // px
    margenSuperior: 15, // px
    margenInferior: 15, // px
  },
  // Información adicional
  info: {
    visible: true,
    dni: {
      visible: true,
      etiqueta: 'DNI:',
      tamaño: 14, // px
    },
    fecha: {
      visible: true,
      etiqueta: 'Fecha:',
      formato: 'dd/mm/yyyy', // dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd
      tamaño: 14, // px
    },
    hora: {
      visible: true,
      etiqueta: 'Hora:',
      formato: '24h', // 12h, 24h
      tamaño: 14, // px
    },
    alineacion: 'centro',
    margenSuperior: 15, // px
    interlineado: 1.8,
  },
  // Separador
  separador: {
    visible: true,
    estilo: 'dashed', // solid, dashed, dotted
    grosor: 2, // px
    margenSuperior: 15, // px
    margenInferior: 15, // px
  },
  // Pie de página
  footer: {
    visible: true,
    lineas: ['Espere en la sala a ser llamado', '¡Gracias por su paciencia!'],
    tamaño: 11, // px
    alineacion: 'centro',
    margenSuperior: 15, // px
  },
  // Orden de los elementos (para drag & drop)
  orden: ['logo', 'tituloSector', 'numeroTurno', 'separador-1', 'info', 'separador-2', 'footer'],
}

// GET - Listar todas las configuraciones
export async function GET() {
  try {
    const configs = await db.ticketConfig.findMany({
      orderBy: { createdAt: 'asc' }
    })

    // Si no hay configuraciones, crear la default
    if (configs.length === 0) {
      const defaultConfig = await db.ticketConfig.create({
        data: {
          nombre: 'Default',
          descripcion: 'Configuración por defecto del sistema',
          esDefault: true,
          config: JSON.stringify(DEFAULT_TICKET_CONFIG)
        }
      })
      return NextResponse.json([defaultConfig])
    }

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Error al obtener configuraciones de tickets:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuraciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva configuración
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, config, esDefault } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Si es default, quitar el flag de las otras
    if (esDefault) {
      await db.ticketConfig.updateMany({
        where: { esDefault: true },
        data: { esDefault: false }
      })
    }

    const nuevaConfig = await db.ticketConfig.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        esDefault: esDefault || false,
        config: JSON.stringify(config || DEFAULT_TICKET_CONFIG)
      }
    })

    return NextResponse.json(nuevaConfig)
  } catch (error: any) {
    console.error('Error al crear configuración:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una configuración con ese nombre' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear configuración' },
      { status: 500 }
    )
  }
}
