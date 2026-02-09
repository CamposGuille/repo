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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
