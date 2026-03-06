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

  // Eliminar ausentes y finalizados existentes
  await prisma.turno.deleteMany({ where: { estado: { in: ['ausente', 'finalizado'] } } })

  // Crear turnos balanceados: 5 ausentes y 7 finalizados
  const turnos = [
    // Finalizados (verdes)
    { numero: 'F-001', sectorId: farmacia.id, estado: 'finalizado' },
    { numero: 'I-002', sectorId: informes.id, estado: 'finalizado' },
    { numero: 'V-001', sectorId: vacunatorio.id, estado: 'finalizado' },
    { numero: 'L-001', sectorId: laboratorio.id, estado: 'finalizado' },
    { numero: 'F-003', sectorId: farmacia.id, estado: 'finalizado' },
    { numero: 'I-004', sectorId: informes.id, estado: 'finalizado' },
    { numero: 'V-003', sectorId: vacunatorio.id, estado: 'finalizado' },
    // Ausentes (rojos)
    { numero: 'F-015', sectorId: farmacia.id, estado: 'ausente' },
    { numero: 'I-008', sectorId: informes.id, estado: 'ausente' },
    { numero: 'V-012', sectorId: vacunatorio.id, estado: 'ausente' },
    { numero: 'L-003', sectorId: laboratorio.id, estado: 'ausente' },
    { numero: 'F-018', sectorId: farmacia.id, estado: 'ausente' },
  ]

  for (const turno of turnos) {
    await prisma.turno.create({
      data: {
        numero: turno.numero,
        dni: '00000000',
        sectorId: turno.sectorId,
        estado: turno.estado,
        fechaCreacion: new Date(Date.now() - 3600000),
        fechaFinalizado: turno.estado === 'finalizado' ? new Date() : null,
      }
    })
  }

  console.log('✅ 12 turnos creados (7 finalizados verdes + 5 ausentes rojos)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
