import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Obtener sectores existentes
  const farmacia = await prisma.sector.findFirst({ where: { nombre: 'Farmacia' } })
  const informes = await prisma.sector.findFirst({ where: { nombre: 'Informes' } })
  const vacunatorio = await prisma.sector.findFirst({ where: { nombre: 'Vacunatorio' } })
  const laboratorio = await prisma.sector.findFirst({ where: { nombre: 'Laboratorio - Resultados' } })

  if (!farmacia || !informes || !vacunatorio || !laboratorio) {
    console.log('No se encontraron sectores')
    return
  }

  // Crear turnos finalizados
  const finalizados = [
    { numero: 'F-001', sectorId: farmacia.id },
    { numero: 'F-002', sectorId: farmacia.id },
    { numero: 'I-001', sectorId: informes.id },
    { numero: 'I-002', sectorId: informes.id },
    { numero: 'V-001', sectorId: vacunatorio.id },
    { numero: 'V-002', sectorId: vacunatorio.id },
    { numero: 'L-001', sectorId: laboratorio.id },
    { numero: 'L-002', sectorId: laboratorio.id },
    { numero: 'F-003', sectorId: farmacia.id },
    { numero: 'I-003', sectorId: informes.id },
  ]

  for (const turno of finalizados) {
    await prisma.turno.create({
      data: {
        numero: turno.numero,
        dni: '00000000',
        sectorId: turno.sectorId,
        estado: 'finalizado',
        fechaCreacion: new Date(Date.now() - 3600000),
        fechaFinalizado: new Date(),
      }
    })
  }

  console.log('✅ 10 turnos finalizados creados correctamente!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
