import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const monitorId = formData.get('monitorId') as string
    
    if (!file || !monitorId) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }
    
    // Crear directorio si no existe
    const uploadsDir = path.join(process.cwd(), 'uploads', 'videos')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    // Generar nombre único
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${originalName}`
    const filePath = path.join(uploadsDir, fileName)
    
    // Guardar archivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)
    
    // Contar videos existentes para el orden
    const existingVideos = await db.videoMonitor.count({
      where: { monitorId }
    })
    
    // Guardar en base de datos
    const video = await db.videoMonitor.create({
      data: {
        nombre: file.name,
        ruta: fileName,
        orden: existingVideos + 1,
        activo: true,
        monitorId
      }
    })
    
    return NextResponse.json(video)
  } catch (error) {
    console.error('Error al subir video:', error)
    return NextResponse.json({ error: 'Error al subir video' }, { status: 500 })
  }
}
