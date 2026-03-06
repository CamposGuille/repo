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

  // Eliminar ausentes existentes
  await prisma.turno.deleteMany({ where: { estado: 'ausente' } })

  // Crear 20 turnos ausentes para llenar el recuadro
  const ausentes = [
    { numero: 'F-015', sectorId: farmacia.id },
    { numero: 'I-008', sectorId: informes.id },
    { numero: 'V-012', sectorId: vacunatorio.id },
    { numero: 'L-003', sectorId: laboratorio.id },
    { numero: 'F-018', sectorId: farmacia.id },
    { numero: 'I-010', sectorId: informes.id },
    { numero: 'V-019', sectorId: vacunatorio.id },
    { numero: 'F-025', sectorId: farmacia.id },
    { numero: 'L-007', sectorId: laboratorio.id },
    { numero: 'I-011', sectorId: informes.id },
    { numero: 'F-032', sectorId: farmacia.id },
    { numero: 'V-021', sectorId: vacunatorio.id },
    { numero: 'L-009', sectorId: laboratorio.id },
    { numero: 'F-041', sectorId: farmacia.id },
    { numero: 'I-015', sectorId: informes.id },
    { numero: 'V-028', sectorId: vacunatorio.id },
    { numero: 'F-044', sectorId: farmacia.id },
    { numero: 'L-012', sectorId: laboratorio.id },
    { numero: 'I-019', sectorId: informes.id },
    { numero: 'V-035', sectorId: vacunatorio.id },
  ]

  for (const ausente of ausentes) {
    await prisma.turno.create({
      data: {
        numero: ausente.numero,
        dni: '00000000',
        sectorId: ausente.sectorId,
        estado: 'ausente',
        fechaCreacion: new Date(),
      }
    })
  }

  console.log('✅ 20 ausentes creados correctamente!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
