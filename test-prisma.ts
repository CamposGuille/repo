import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function testPrisma() {
  try {
    console.log('Modelos disponibles:', Object.keys(db))

    // Intentar obtener la configuración
    const configuracion = await db.configuracion.findUnique({
      where: { id: 'default' }
    })

    console.log('Configuración:', configuracion)

    // Intentar obtener operadores
    const operadores = await db.operador.findMany()
    console.log('Operadores encontrados:', operadores.length)

    // Intentar obtener sectores
    const sectores = await db.sector.findMany()
    console.log('Sectores encontrados:', sectores.length)

  } catch (error: any) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await db.$disconnect()
  }
}

testPrisma()
