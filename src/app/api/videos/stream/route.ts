import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const video = searchParams.get('video')
    
    if (!video) {
      return NextResponse.json({ error: 'Video no especificado' }, { status: 400 })
    }
    
    const filePath = path.join(process.cwd(), 'uploads', 'videos', video)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }
    
    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = request.headers.get('range')
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1
      
      const fileStream = fs.createReadStream(filePath, { start, end })
      
      // Para Next.js, necesitamos convertir el stream a buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of fileStream) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      
      return new NextResponse(buffer, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': 'video/mp4',
        },
      })
    }
    
    const fileStream = fs.createReadStream(filePath)
    const chunks: Uint8Array[] = []
    for await (const chunk of fileStream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4',
      },
    })
  } catch (error) {
    console.error('Error al reproducir video:', error)
    return NextResponse.json({ error: 'Error al reproducir video' }, { status: 500 })
  }
}
