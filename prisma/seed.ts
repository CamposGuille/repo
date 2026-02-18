import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Crear administrador por defecto si no existe
  const adminExistente = await prisma.admin.findUnique({
    where: { username: 'admin' }
  })

  if (!adminExistente) {
    const passwordHashed = await bcrypt.hash('admin123', 10)
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        password: passwordHashed,
        nombre: 'Administrador',
        activo: true
      }
    })
    console.log('Administrador por defecto creado:', admin.username)
  } else {
    console.log('El administrador por defecto ya existe')
  }

  // Crear sectores si no existen
  const sectoresExistentes = await prisma.sector.count()
  
  if (sectoresExistentes === 0) {
    const sectores = await Promise.all([
      prisma.sector.create({
        data: { nombre: 'Farmacia', color: '#10b981', activo: true, numeroTurno: 1 }
      }),
      prisma.sector.create({
        data: { nombre: 'Informes', color: '#3b82f6', activo: true, numeroTurno: 1 }
      }),
      prisma.sector.create({
        data: { nombre: 'Laboratorio', color: '#8b5cf6', activo: true, numeroTurno: 1 }
      }),
      prisma.sector.create({
        data: { nombre: 'Vacunatorio', color: '#f59e0b', activo: true, numeroTurno: 1 }
      })
    ])
    console.log('Sectores creados:', sectores.map(s => s.nombre).join(', '))
  } else {
    console.log('Ya existen sectores')
  }

  // Crear cajas/boxes si no existen
  const boxesExistentes = await prisma.box.count()
  
  if (boxesExistentes === 0) {
    const boxes = await Promise.all([
      prisma.box.create({
        data: { nombre: 'Box 1', descripcion: 'Atención general', activo: true }
      }),
      prisma.box.create({
        data: { nombre: 'Box 2', descripcion: 'Atención general', activo: true }
      }),
      prisma.box.create({
        data: { nombre: 'Box 3', descripcion: 'Atención prioritaria', activo: true }
      })
    ])
    console.log('Boxes creados:', boxes.map(b => b.nombre).join(', '))
  } else {
    console.log('Ya existen boxes')
  }

  // Crear operadores si no existen
  const operadoresExistentes = await prisma.operador.count()
  
  if (operadoresExistentes === 0) {
    const passwordHashed = await bcrypt.hash('admin123', 10)
    
    // Obtener sectores y boxes para asignar
    const sectores = await prisma.sector.findMany()
    const boxes = await prisma.box.findMany()
    
    const operador1 = await prisma.operador.create({
      data: {
        username: 'operador1',
        password: passwordHashed,
        nombre: 'Operador Uno',
        activo: true,
        sectores: {
          create: sectores.slice(0, 2).map(s => ({ sectorId: s.id }))
        },
        boxes: boxes.length > 0 ? {
          create: [{ boxId: boxes[0].id }]
        } : undefined
      }
    })
    
    const operador2 = await prisma.operador.create({
      data: {
        username: 'operador2',
        password: passwordHashed,
        nombre: 'Operador Dos',
        activo: true,
        sectores: {
          create: sectores.slice(2).map(s => ({ sectorId: s.id }))
        },
        boxes: boxes.length > 1 ? {
          create: [{ boxId: boxes[1].id }]
        } : undefined
      }
    })
    
    console.log('Operadores creados:', operador1.username, operador2.username)
  } else {
    console.log('Ya existen operadores')
  }

  // Crear monitor por defecto si no existe
  const monitorExistente = await prisma.monitor.count()
  
  if (monitorExistente === 0) {
    const sectores = await prisma.sector.findMany()
    const monitor = await prisma.monitor.create({
      data: {
        nombre: 'Monitor Principal',
        descripcion: 'Monitor de sala de espera',
        activo: true,
        sectores: {
          create: sectores.map(s => ({ sectorId: s.id }))
        }
      }
    })
    console.log('Monitor creado:', monitor.nombre)
  } else {
    console.log('Ya existen monitores')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
