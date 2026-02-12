'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Bell, Clock, Monitor as MonitorIcon } from 'lucide-react'

interface TurnoActivo {
  id: string
  numero: string
  estado: string
  fechaLlamado: string
  sector: {
    id: string
    nombre: string
    color: string
  }
  operador: {
    nombre: string
  }
}

interface SectorAsignado {
  id: string
  nombre: string
  color: string
}

interface Monitor {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
}

const playDingDong = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Primera nota: DING (tono alto y brillante)
    const oscillator1 = audioContext.createOscillator()
    const gainNode1 = audioContext.createGain()
    oscillator1.connect(gainNode1)
    gainNode1.connect(audioContext.destination)
    oscillator1.frequency.value = 830.61 // B5
    oscillator1.type = 'sine'
    gainNode1.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode1.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02)
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0)
    oscillator1.start(audioContext.currentTime)
    oscillator1.stop(audioContext.currentTime + 1.0)

    // Segunda nota: DONG (tono más bajo y resonante)
    const oscillator2 = audioContext.createOscillator()
    const gainNode2 = audioContext.createGain()
    oscillator2.connect(gainNode2)
    gainNode2.connect(audioContext.destination)
    oscillator2.frequency.value = 587.33 // D5
    oscillator2.type = 'sine'
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.25)
    gainNode2.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.27)
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5)
    oscillator2.start(audioContext.currentTime + 0.25)
    oscillator2.stop(audioContext.currentTime + 1.5)

    // Añadir armónicos para un sonido más rico
    const harmonic1 = audioContext.createOscillator()
    const gainH1 = audioContext.createGain()
    harmonic1.connect(gainH1)
    gainH1.connect(audioContext.destination)
    harmonic1.frequency.value = 830.61 * 2 // Una octava arriba
    harmonic1.type = 'sine'
    gainH1.gain.setValueAtTime(0, audioContext.currentTime)
    gainH1.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02)
    gainH1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)
    harmonic1.start(audioContext.currentTime)
    harmonic1.stop(audioContext.currentTime + 0.6)

  } catch (error) {
    console.error('Error al reproducir Ding Dong:', error)
  }
}

const playBeep = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.value = 1000
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (error) {
    console.error('Error al reproducir beep:', error)
  }
}

const playDoubleBeep = () => {
  playBeep()
  setTimeout(() => {
    playBeep()
  }, 300)
}

export default function MonitorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlMonitorId = searchParams.get('monitor')

  const [turnosActivos, setTurnosActivos] = useState<TurnoActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [sectoresAsignados, setSectoresAsignados] = useState<SectorAsignado[]>([])
  const turnosBeepedRef = useRef<Set<string>>(new Set())

  const [monitores, setMonitores] = useState<Monitor[]>([])
  const [monitorConfigurado, setMonitorConfigurado] = useState<string | null>(null)
  const [monitorSeleccionado, setMonitorSeleccionado] = useState<string>('')
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
    }
  }

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch('/api/admin/configuracion')
      const data = await response.json()
      if (response.ok) {
        setTextosConfiguracion(data)
        setMonitorConfigurado(data.monitorId)
        if (!urlMonitorId && data.monitorId) {
          setMonitorSeleccionado(data.monitorId)
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    }
  }

  const cargarSectoresAsignados = async () => {
    if (!monitorSeleccionado) return

    try {
      const response = await fetch(`/api/admin/monitores/${monitorSeleccionado}`)
      const data = await response.json()

      if (response.ok && data.sectores) {
        setSectoresAsignados(data.sectores.map((ms: any) => ms.sector))
      }
    } catch (error) {
      console.error('Error al cargar sectores del monitor:', error)
    }
  }

  const handleCambiarMonitor = (nuevoMonitorId: string) => {
    setMonitorSeleccionado(nuevoMonitorId)
    const params = new URLSearchParams(window.location.search)
    params.set('monitor', nuevoMonitorId)
    router.push(`/monitor?${params.toString()}`)
  }

  const cargarTurnosActivos = async () => {
    try {
      const response = await fetch('/api/turnos/activos')
      const data = await response.json()

      if (response.ok) {
        // Filtrar turnos por sectores asignados al monitor
        // Si no hay sectores asignados, no mostrar ningún turno
        const turnosFiltrados = sectoresAsignados.length > 0
          ? data.filter((turno: TurnoActivo) =>
              sectoresAsignados.some((sector: SectorAsignado) =>
                sector.id === turno.sector.id
              )
            )
          : []

        // Solo reproducir sonido para turnos de sectores asignados a este monitor
        const nuevosTurnosLlamados = turnosFiltrados.filter(
          (turno: TurnoActivo) =>
            turno.estado === 'llamado' && !turnosBeepedRef.current.has(turno.id)
        )

        if (nuevosTurnosLlamados.length > 0) {
          nuevosTurnosLlamados.forEach((turno: TurnoActivo) => {
            turnosBeepedRef.current.add(turno.id)
          })
          playDingDong()
        }

        setTurnosActivos(turnosFiltrados)
      }
    } catch (error) {
      console.error('Error al cargar turnos activos:', error)
    }
  }

  useEffect(() => {
    cargarMonitores()
    cargarConfiguracion()
  }, [])

  useEffect(() => {
    if (monitorSeleccionado) {
      cargarSectoresAsignados()
      cargarTurnosActivos()
    } else {
      setSectoresAsignados([])
      setTurnosActivos([])
      setLoading(false)
    }
  }, [monitorSeleccionado])

  useEffect(() => {
    const interval = setInterval(cargarTurnosActivos, 10000)
    return () => clearInterval(interval)
  }, [monitorSeleccionado, sectoresAsignados])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {!monitorSeleccionado ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-4xl mx-auto">
              <CardContent className="p-12">
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
                  <p className="text-slate-400 text-lg mb-2">
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
                  <div>
                    <p className="text-slate-300 text-center mb-6">
                      Seleccione el monitor que desea ver:
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {monitores.map((monitor) => (
                        <button
                          key={monitor.id}
                          onClick={() => {
                            setMonitorSeleccionado(monitor.id)
                            const params = new URLSearchParams(window.location.search)
                            params.set('monitor', monitor.id)
                            router.push(`/monitor?${params.toString()}`)
                          }}
                          className={`p-6 rounded-lg text-left transition-all border-2 ${
                            monitor.id === monitorConfigurado
                              ? 'bg-primary/30 border-primary shadow-lg shadow-primary/30'
                              : 'bg-white/5 hover:bg-white/10 border-white/20 hover:border-white/40'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-white text-lg">
                              {monitor.nombre}
                            </div>
                            {monitor.id === monitorConfigurado && (
                              <span className="text-xs px-2 py-1 bg-primary/50 rounded-full text-white">
                                Por defecto
                              </span>
                            )}
                          </div>
                          {monitor.descripcion && (
                            <div className="text-slate-300 text-sm">
                              {monitor.descripcion}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <header className="text-center mb-4">
              {textosConfiguracion?.totemLogoUrl ? (
                <img
                  src={textosConfiguracion.totemLogoUrl}
                  alt="Logo Institución"
                  className="h-12 md:h-16 mx-auto mb-3 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="flex justify-center mb-3">
                  <MonitorIcon className="w-10 h-10 text-primary" />
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {textosConfiguracion?.monitorTitulo || 'Monitor de Turnos'}
              </h1>
            </header>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
              </div>
            ) : turnosActivos.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-16 text-center">
                  <Clock className="w-24 h-24 mx-auto mb-4 text-slate-400" />
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Sin turnos en atencion
                  </h2>
                  <p className="text-slate-400 text-lg">
                    Espere a que un operador llame al proximo turno
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="min-h-[calc(100vh-8rem)] flex gap-4 md:gap-6 w-full items-center justify-center flex-wrap">
                {turnosActivos.map((turno) => (
                  <Card
                    key={turno.id}
                    className="overflow-hidden shadow-2xl border-2 animate-in slide-in-from-bottom-4 relative min-w-0"
                    style={{
                      borderColor: turno.sector.color,
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      flex: turnosActivos.length === 1 ? '0 1 auto' : '1 1 0',
                    }}
                  >
                    <div
                      className="p-4 text-white"
                      style={{ backgroundColor: turno.sector.color }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-semibold opacity-90 whitespace-nowrap">
                          {turno.sector.nombre}
                        </span>
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs whitespace-nowrap">
                          {turno.estado === 'llamado' ? 'Llamando...' : 'En atencion'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 flex justify-center items-center">
                      <div
                        className="font-bold leading-tight text-center whitespace-nowrap"
                        style={{
                          fontSize: turnosActivos.length === 1 ? '12vw' :
                                   turnosActivos.length === 2 ? '10vw' :
                                   turnosActivos.length === 3 ? '8vw' :
                                   turnosActivos.length === 4 ? '7vw' :
                                   '5vw',
                          minHeight: '10vh'
                        }}
                      >
                        {turno.numero}
                      </div>
                    </div>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 text-sm">Hora:</span>
                        <span
                          className="font-semibold text-slate-900"
                          style={{
                            fontSize: turnosActivos.length === 1 ? '1.125rem' :
                                     turnosActivos.length === 2 ? '1rem' :
                                     '0.875rem'
                          }}
                        >
                          {new Date(turno.fechaLlamado).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </CardContent>
                    {turno.estado === 'llamado' && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className="absolute inset-0 animate-pulse opacity-10"
                          style={{ backgroundColor: turno.sector.color }}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}


          </>
        )}
      </div>
    </div>
  )
}
