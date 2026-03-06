import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Buscar el video
    const video = await db.videoMonitor.findUnique({
      where: { id }
    })
    
    if (!video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }
    
    // Eliminar el archivo físico
    if (video.ruta) {
      const filePath = path.join(process.cwd(), 'uploads', 'videos', video.ruta)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    
    // Eliminar de la base de datos
    await db.videoMonitor.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar video:', error)
    return NextResponse.json({ error: 'Error al eliminar video' }, { status: 500 })
  }
}
