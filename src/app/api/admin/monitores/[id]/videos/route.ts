import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// API para obtener videos de un monitor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const videos = await db.videoMonitor.findMany({
      where: { 
        monitorId: id,
        activo: true 
      },
      orderBy: { orden: 'asc' }
    })
    
    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error al obtener videos:', error)
    return NextResponse.json({ error: 'Error al obtener videos' }, { status: 500 })
  }
}
