'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Clock, Monitor as MonitorIcon, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  box?: {
    id: string
    nombre: string
  } | null
  operador: {
    nombre: string
  }
}

interface SectorAsignado {
  id: string
  nombre: string
  color: string
}

interface MonitorData {
  id: string
  numero: number
  nombre: string
  descripcion?: string
}

const playDingDong = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext())

    // DING
    const oscillator1 = audioContext.createOscillator()
    const gainNode1 = audioContext.createGain()
    oscillator1.connect(gainNode1)
    gainNode1.connect(audioContext.destination)
    oscillator1.frequency.value = 830.61
    oscillator1.type = 'sine'
    gainNode1.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode1.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02)
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0)
    oscillator1.start(audioContext.currentTime)
    oscillator1.stop(audioContext.currentTime + 1.0)

    // DONG
    const oscillator2 = audioContext.createOscillator()
    const gainNode2 = audioContext.createGain()
    oscillator2.connect(gainNode2)
    gainNode2.connect(audioContext.destination)
    oscillator2.frequency.value = 587.33
    oscillator2.type = 'sine'
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.25)
    gainNode2.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.27)
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5)
    oscillator2.start(audioContext.currentTime + 0.25)
    oscillator2.stop(audioContext.currentTime + 1.5)

    // Armónicos
    const harmonic1 = audioContext.createOscillator()
    const gainH1 = audioContext.createGain()
    harmonic1.connect(gainH1)
    gainH1.connect(audioContext.destination)
    harmonic1.frequency.value = 830.61 * 2
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

const playCustomSound = (soundUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(soundUrl)
      audio.play()
        .then(() => {
          audio.onended = () => resolve()
        })
        .catch((error) => {
          reject(error)
        })
      audio.onerror = (e) => {
        reject(e)
      }
    } catch (error) {
      reject(error)
    }
  })
}

export default function MonitorIndividualPage() {
  const params = useParams()
  const router = useRouter()
  const monitorNumero = params.numero as string

  const [turnosActivos, setTurnosActivos] = useState<TurnoActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null)
  const [sectoresAsignados, setSectoresAsignados] = useState<SectorAsignado[]>([])
  // Map para guardar ID del turno -> fecha de llamado (para detectar re-llamados)
  const turnosBeepedRef = useRef<Map<string, string>>(new Map())

  const [textosConfiguracion, setTextosConfiguracion] = useState<any>(null)
  const [monitorSonidoUrl, setMonitorSonidoUrl] = useState<string | null>(null)
  const monitorSonidoUrlRef = useRef<string | null>(null)
  
  const [audioEnabled, setAudioEnabled] = useState(false)

  const unlockAudio = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext())

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      gainNode.gain.value = 0
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.001)

      setAudioEnabled(true)
    } catch (error) {
      console.error('Error al desbloquear audio:', error)
    }
  }

  const cargarMonitor = async () => {
    try {
      const response = await fetch(`/api/admin/monitores/numero/${monitorNumero}`)
      const data = await response.json()
      
      if (response.ok) {
        setMonitorData(data)
        if (data.sectores) {
          setSectoresAsignados(data.sectores.map((ms: any) => ms.sector))
        }
      } else {
        router.push('/monitor')
      }
    } catch (error) {
      console.error('Error al cargar monitor:', error)
      router.push('/monitor')
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
        const sonidoUrl = data.monitorSonidoUrl || null
        setMonitorSonidoUrl(sonidoUrl)
        monitorSonidoUrlRef.current = sonidoUrl
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    }
  }

  const cargarTurnosActivos = async () => {
    try {
      const response = await fetch('/api/turnos/activos')
      const data = await response.json()

      if (response.ok) {
        const turnosFiltrados = sectoresAsignados.length > 0
          ? data.filter((turno: TurnoActivo) =>
              sectoresAsignados.some((sector: SectorAsignado) =>
                sector.id === turno.sector.id
              )
            )
          : []

        // Detectar turnos que necesitan sonido:
        // - Estado "llamado" y no se ha reproducido antes, O
        // - Estado "llamado" y la fecha de llamado cambió (re-llamado)
        const turnosParaSonar = turnosFiltrados.filter((turno: TurnoActivo) => {
          if (turno.estado !== 'llamado') return false
          
          const fechaLlamadoGuardada = turnosBeepedRef.current.get(turno.id)
          const fechaLlamadoActual = turno.fechaLlamado
          
          // Si no se ha guardado, es nuevo -> sonar
          if (!fechaLlamadoGuardada) return true
          
          // Si la fecha cambió, es un re-llamado -> sonar
          if (fechaLlamadoGuardada !== fechaLlamadoActual) return true
          
          return false
        })

        if (turnosParaSonar.length > 0 && audioEnabled) {
          // Actualizar el Map con las nuevas fechas
          turnosParaSonar.forEach((turno: TurnoActivo) => {
            turnosBeepedRef.current.set(turno.id, turno.fechaLlamado)
          })
          
          const sonidoUrl = monitorSonidoUrlRef.current
          if (sonidoUrl) {
            playCustomSound(sonidoUrl).catch(() => playDingDong())
          } else {
            playDingDong()
          }
        }

        setTurnosActivos(turnosFiltrados)
      }
    } catch (error) {
      console.error('Error al cargar turnos activos:', error)
    }
  }

  const handleVolver = () => {
    router.push('/monitor')
  }

  useEffect(() => {
    cargarConfiguracion()
    cargarMonitor()
  }, [monitorNumero])

  useEffect(() => {
    if (sectoresAsignados.length > 0) {
      cargarTurnosActivos()
    }
  }, [sectoresAsignados])

  useEffect(() => {
    if (sectoresAsignados.length === 0) return
    
    const interval = setInterval(cargarTurnosActivos, 10000)
    return () => clearInterval(interval)
  }, [sectoresAsignados, audioEnabled])

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 md:p-4 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto flex flex-col">
        {/* Botones de control */}
        <div className="flex justify-between items-center py-2 px-4">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleVolver}
          >
            ← Cambiar Monitor
          </Button>
          
          <Button
            variant={audioEnabled ? "default" : "outline"}
            className={audioEnabled 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "border-white/30 text-white hover:bg-white/10"
            }
            onClick={() => audioEnabled ? setAudioEnabled(false) : unlockAudio()}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Sonido Activado
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                Activar Sonido
              </>
            )}
          </Button>
        </div>

        {/* Header */}
        <header className="text-center py-2 flex-shrink-0">
          {textosConfiguracion?.totemLogoUrl ? (
            <img
              src={textosConfiguracion.totemLogoUrl}
              alt="Logo Institución"
              className="h-8 md:h-12 mx-auto mb-2 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex justify-center mb-2">
              <MonitorIcon className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {monitorData?.nombre || textosConfiguracion?.monitorTitulo || 'Monitor de Turnos'}
          </h1>
        </header>

        {/* Contenido */}
        {turnosActivos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 md:p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-3 text-slate-400" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  Sin turnos en atencion
                </h2>
                <p className="text-slate-400">
                  Espere a que un operador llame al proximo turno
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 md:gap-6 w-full items-center justify-center px-4">
            {turnosActivos.map((turno) => (
              <Card
                key={turno.id}
                className="overflow-hidden shadow-2xl border-2 animate-in slide-in-from-bottom-4 relative flex flex-col"
                style={{
                  borderColor: turno.sector.color,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  width: turnosActivos.length === 1 ? 'auto' : 
                         turnosActivos.length === 2 ? '48%' : 
                         turnosActivos.length === 3 ? '32%' : '24%',
                  minWidth: turnosActivos.length === 1 ? '450px' : '280px',
                  maxWidth: turnosActivos.length === 1 ? '600px' : '400px'
                }}
              >
                <div
                  className="p-3 md:p-4 text-white flex-shrink-0"
                  style={{ backgroundColor: turno.sector.color }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base md:text-lg font-semibold opacity-90 whitespace-nowrap">
                      {turno.sector.nombre}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm whitespace-nowrap">
                      {turno.estado === 'llamado' ? 'Llamando...' : 'En atencion'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-center items-center py-8 md:py-12">
                  <div
                    className="font-bold leading-tight text-center whitespace-nowrap"
                    style={{
                      fontSize: turnosActivos.length === 1 ? '7rem' :
                               turnosActivos.length === 2 ? '5.5rem' :
                               turnosActivos.length === 3 ? '4rem' :
                               '3rem'
                    }}
                  >
                    {turno.numero}
                  </div>
                </div>
                <CardContent className="pt-0 pb-4 flex-shrink-0">
                  {turno.box && (
                    <div className="flex items-center justify-center mb-3">
                      <span
                        className="px-12 py-3 font-bold text-white shadow-lg text-center inline-block"
                        style={{
                          backgroundColor: turno.sector.color,
                          borderRadius: '25px',
                          fontSize: turnosActivos.length === 1 ? '1.75rem' :
                                   turnosActivos.length === 2 ? '1.5rem' :
                                   '1.25rem',
                          minWidth: turnosActivos.length === 1 ? '300px' : '220px'
                        }}
                      >
                        {turno.box.nombre}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-slate-600 text-base">Hora:</span>
                    <span
                      className="font-semibold text-slate-900"
                      style={{
                        fontSize: turnosActivos.length === 1 ? '1.25rem' :
                                 turnosActivos.length === 2 ? '1.1rem' :
                                 '1rem'
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
      </div>
    </div>
  )
}
