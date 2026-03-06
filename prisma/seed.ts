import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Verificando base de datos...')

  // ============================================
  // VERIFICAR SI YA HAY DATOS EXISTENTES
  // ============================================
  const operadoresExistentes = await prisma.operador.count()
  const sectoresExistentes = await prisma.sector.count()
  const turnosExistentes = await prisma.turno.count()

  if (operadoresExistentes > 0 || sectoresExistentes > 0 || turnosExistentes > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  LA BASE DE DATOS YA CONTIENE DATOS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   👤 Operadores: ${operadoresExistentes}`)
    console.log(`   🏢 Sectores: ${sectoresExistentes}`)
    console.log(`   🎫 Turnos: ${turnosExistentes}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Seed cancelado - No se modificaron datos existentes')
    console.log('💡 Para crear datos de prueba, usa una base de datos vacía')
    return
  }

  console.log('📝 Base de datos vacía. Creando datos de prueba...')

  // ============================================
  // 1. CREAR ADMIN
  // ============================================
  const admin = await prisma.admin.create({
    data: { 
      username: 'admin', 
      password: 'admin123', 
      nombre: 'Administrador',
      activo: true 
    }
  })
  console.log('✅ Admin creado:', admin.username)

  // ============================================
  // 2. CREAR SECTORES
  // ============================================
  const farmacia = await prisma.sector.create({
    data: { 
      nombre: 'Farmacia', 
      color: '#10b981', 
      numeroTurno: 1,
      activo: true 
    }
  })

  const informes = await prisma.sector.create({
    data: { 
      nombre: 'Informes', 
      color: '#00d5ff', 
      numeroTurno: 1,
      activo: true 
    }
  })

  const vacunatorio = await prisma.sector.create({
    data: { 
      nombre: 'Vacunatorio', 
      color: '#fa0085', 
      numeroTurno: 1,
      activo: true 
    }
  })

  const laboratorio = await prisma.sector.create({
    data: { 
      nombre: 'Laboratorio - Resultados', 
      color: '#1e00ff', 
      numeroTurno: 1,
      activo: true 
    }
  })

  console.log('✅ Sectores creados: Farmacia, Informes, Vacunatorio, Laboratorio')

  // ============================================
  // 3. CREAR OPERADORES
  // ============================================
  const operador1 = await prisma.operador.create({
    data: {
      username: 'operador1',
      password: 'operador123',
      nombre: 'María García',
      activo: true
    }
  })

  const operador2 = await prisma.operador.create({
    data: {
      username: 'operador2',
      password: 'operador123',
      nombre: 'Juan Pérez',
      activo: true
    }
  })

  const operador3 = await prisma.operador.create({
    data: {
      username: 'operador3',
      password: 'operador123',
      nombre: 'Ana Rodríguez',
      activo: true
    }
  })

  console.log('✅ Operadores creados: operador1, operador2, operador3')

  // ============================================
  // 4. ASIGNAR SECTORES A OPERADORES
  // ============================================
  await prisma.operadorSector.createMany({
    data: [
      { operadorId: operador1.id, sectorId: farmacia.id },
      { operadorId: operador1.id, sectorId: informes.id },
      { operadorId: operador2.id, sectorId: vacunatorio.id },
      { operadorId: operador2.id, sectorId: laboratorio.id },
      { operadorId: operador3.id, sectorId: farmacia.id },
      { operadorId: operador3.id, sectorId: informes.id },
      { operadorId: operador3.id, sectorId: vacunatorio.id },
      { operadorId: operador3.id, sectorId: laboratorio.id },
    ]
  })
  console.log('✅ Sectores asignados a operadores')

  // ============================================
  // 5. CREAR BOXES
  // ============================================
  const box1 = await prisma.box.create({
    data: {
      nombre: 'Box 1',
      descripcion: 'Ventanilla principal',
      activo: true
    }
  })

  const box2 = await prisma.box.create({
    data: {
      nombre: 'Box 2',
      descripcion: 'Ventanilla secundaria',
      activo: true
    }
  })

  const box3 = await prisma.box.create({
    data: {
      nombre: 'Box 3',
      descripcion: 'Box de informes',
      activo: true
    }
  })

  const box4 = await prisma.box.create({
    data: {
      nombre: 'Box 4',
      descripcion: 'Box de vacunatorio',
      activo: true
    }
  })

  console.log('✅ Boxes creados: Box 1, Box 2, Box 3, Box 4')

  // ============================================
  // 6. ASIGNAR BOXES A OPERADORES
  // ============================================
  await prisma.operadorBox.createMany({
    data: [
      { operadorId: operador1.id, boxId: box1.id },
      { operadorId: operador1.id, boxId: box2.id },
      { operadorId: operador2.id, boxId: box3.id },
      { operadorId: operador2.id, boxId: box4.id },
      { operadorId: operador3.id, boxId: box1.id },
      { operadorId: operador3.id, boxId: box2.id },
      { operadorId: operador3.id, boxId: box3.id },
      { operadorId: operador3.id, boxId: box4.id },
    ]
  })
  console.log('✅ Boxes asignados a operadores')

  // ============================================
  // 7. CREAR MONITORES
  // ============================================
  const m1 = await prisma.monitor.create({
    data: { 
      numero: 1, 
      nombre: 'Monitor 1', 
      descripcion: 'Sala de espera principal',
      activo: true 
    }
  })

  const m2 = await prisma.monitor.create({
    data: { 
      numero: 2, 
      nombre: 'Monitor 2', 
      descripcion: 'Sala de espera secundaria',
      activo: true 
    }
  })

  const m3 = await prisma.monitor.create({
    data: { 
      numero: 3, 
      nombre: 'Monitor 3', 
      descripcion: 'Entrada principal',
      activo: true 
    }
  })

  console.log('✅ Monitores creados: Monitor 1, Monitor 2, Monitor 3')

  // ============================================
  // 8. ASIGNAR SECTORES A MONITORES
  // ============================================
  await prisma.monitorSector.createMany({
    data: [
      { monitorId: m1.id, sectorId: farmacia.id },
      { monitorId: m1.id, sectorId: informes.id },
      { monitorId: m1.id, sectorId: vacunatorio.id },
      { monitorId: m1.id, sectorId: laboratorio.id },
      { monitorId: m2.id, sectorId: informes.id },
      { monitorId: m3.id, sectorId: farmacia.id },
      { monitorId: m3.id, sectorId: informes.id },
      { monitorId: m3.id, sectorId: vacunatorio.id },
    ]
  })
  console.log('✅ Sectores asignados a monitores')

  // ============================================
  // 9. CREAR CONFIGURACIÓN
  // ============================================
  await prisma.configuracion.create({
    data: { 
      id: 'default',
      titulo: 'Sistema de Turnos',
      subtitulo: 'Plataforma de autogestión y atención',
    }
  })
  console.log('✅ Configuración creada')

  // ============================================
  // RESUMEN
  // ============================================
  console.log('\n🎉 Seed completado exitosamente!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 RESUMEN DE DATOS CREADOS:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👤 Admin: admin / admin123')
  console.log('🏢 Sectores: 4 (Farmacia, Informes, Vacunatorio, Laboratorio)')
  console.log('👥 Operadores: 3 (operador1, operador2, operador3)')
  console.log('📦 Boxes: 4 (Box 1-4)')
  console.log('🖥️  Monitores: 3 (Monitor 1-3)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
