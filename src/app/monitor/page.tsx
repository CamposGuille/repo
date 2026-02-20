'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Monitor as MonitorIcon, Loader2 } from 'lucide-react'

interface MonitorData {
  id: string
  numero: number
  nombre: string
  descripcion?: string
}

export default function MonitorSelectorPage() {
  const router = useRouter()
  const [monitores, setMonitores] = useState<MonitorData[]>([])
  const [loading, setLoading] = useState(true)
  const [textosConfiguracion, setTextosConfiguracion] = useState<any>(null)

  const cargarMonitores = async () => {
    try {
      const response = await fetch('/api/admin/monitores')
      const data = await response.json()
      if (response.ok) {
        setMonitores(data)
      }
    } catch (error) {
      console.error('Error al cargar monitores:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch('/api/admin/configuracion')
      const data = await response.json()
      if (response.ok) {
        setTextosConfiguracion(data)
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    }
  }

  useEffect(() => {
    cargarMonitores()
    cargarConfiguracion()
  }, [])

  const handleSeleccionarMonitor = (monitor: MonitorData) => {
    router.push(`/monitor/${monitor.numero}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-4xl mx-auto w-full">
        <CardContent className="p-8 md:p-12">
          <div className="text-center mb-8">
            {textosConfiguracion?.totemLogoUrl ? (
              <img
                src={textosConfiguracion.totemLogoUrl}
                alt="Logo Institución"
                className="h-16 md:h-20 mx-auto mb-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <MonitorIcon className="w-24 h-24 mx-auto mb-6 text-primary" />
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {textosConfiguracion?.monitorTitulo || 'Monitor de Turnos'}
            </h1>
            <p className="text-slate-400 text-lg">
              {textosConfiguracion?.monitorSubtitulo || 'Espere en la sala a ser llamado'}
            </p>
          </div>

          {monitores.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-300 text-lg mb-2">
                No hay monitores configurados
              </p>
              <p className="text-slate-400 text-sm">
                Inicie sesión en el panel de administración para crear monitores.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monitores.map((monitor) => (
                <button
                  key={monitor.id}
                  onClick={() => handleSeleccionarMonitor(monitor)}
                  className="p-6 rounded-lg text-left transition-all border-2 bg-white/5 hover:bg-white/10 border-white/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
                >
                  <div className="font-semibold text-white text-lg mb-1">
                    {monitor.nombre}
                  </div>
                  {monitor.descripcion && (
                    <div className="text-slate-300 text-sm">
                      {monitor.descripcion}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
