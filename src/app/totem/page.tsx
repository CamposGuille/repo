'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Clock, CheckCircle2, ArrowRight, User, Loader2, Printer, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Horario {
  inicio: string
  fin: string
}

interface Sector {
  id: string
  nombre: string
  color: string
  activo: boolean
  horarios?: string | null
}

// Función para verificar si la hora actual está dentro del rango horario
const verificarHorario = (horariosStr: string | null | undefined): { activo: boolean; horarios: Horario[] } => {
  // Si no hay horarios configurados, el sector siempre está activo
  if (!horariosStr) {
    return { activo: true, horarios: [] }
  }

  let horarios: Horario[] = []
  try {
    horarios = JSON.parse(horariosStr)
  } catch (e) {
    console.error('Error al parsear horarios:', e)
    return { activo: true, horarios: [] }
  }

  // Si no hay horarios en el array, siempre activo
  if (horarios.length === 0) {
    return { activo: true, horarios: [] }
  }

  // Obtener hora actual
  const ahora = new Date()
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes() // Minutos desde medianoche

  // Verificar si la hora actual está en algún rango
  for (const horario of horarios) {
    const [horaInicio, minInicio] = horario.inicio.split(':').map(Number)
    const [horaFin, minFin] = horario.fin.split(':').map(Number)
    
    const inicioMinutos = horaInicio * 60 + minInicio
    const finMinutos = horaFin * 60 + minFin

    if (horaActual >= inicioMinutos && horaActual <= finMinutos) {
      return { activo: true, horarios }
    }
  }

  return { activo: false, horarios }
}

// Formatear horarios para mostrar
const formatearHorarios = (horarios: Horario[]): string => {
  if (horarios.length === 0) return ''
  return horarios.map(h => `${h.inicio} - ${h.fin}`).join(' / ')
}

// Función para formatear DNI con puntos (xx.xxx.xxx)
const formatDNI = (dni: string): string => {
  const cleaned = dni.replace(/\D/g, '')
  if (cleaned.length === 0) return ''

  // Formatear como xx.xxx.xxx
  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) {
    return `${cleaned.slice(0, cleaned.length - 3)}.${cleaned.slice(-3)}`
  }
  return `${cleaned.slice(0, cleaned.length - 6)}.${cleaned.slice(-6, -3)}.${cleaned.slice(-3)}`
}

export default function TotemPage() {
  const [dni, setDni] = useState('')
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null)
  const [sectores, setSectores] = useState<Sector[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSectores, setLoadingSectores] = useState(true)
  const [turnoAsignado, setTurnoAsignado] = useState<{
    numero: string
    sector: string
    color: string
    dni: string
    hora: string
  } | null>(null)
  const [printing, setPrinting] = useState(false)
  const [configuracion, setConfiguracion] = useState<{
    totemTitulo?: string
    totemLogoUrl?: string
  } | null>(null)
  const [ticketConfig, setTicketConfig] = useState<any>(null)
  
  // Estado para mensaje de sector fuera de horario
  const [sectorNoDisponible, setSectorNoDisponible] = useState<{
    nombre: string
    horarios: Horario[]
  } | null>(null)
  
  // Estado para forzar actualización de horarios
  const [ultimaVerificacion, setUltimaVerificacion] = useState(Date.now())
  
  const { toast } = useToast()

  // Cargar sectores desde la API
  useEffect(() => {
    const cargarSectores = async () => {
      try {
        const response = await fetch('/api/turnos')
        const data = await response.json()

        if (response.ok) {
          setSectores(data)
        } else {
          toast({
            title: 'Error',
            description: 'No se pudieron cargar los sectores',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Error al cargar sectores:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los sectores',
          variant: 'destructive'
        })
      } finally {
        setLoadingSectores(false)
      }
    }

    cargarSectores()
  }, [toast])

  // Polling cada 5 minutos para verificar cambios de horario
  useEffect(() => {
    const intervalo = setInterval(() => {
      // Actualizar timestamp para forzar re-renderizado
      // Los sectores se re-evaluarán con la nueva hora actual
      setUltimaVerificacion(Date.now())
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(intervalo)
  }, [])

  // Cargar configuración del tótem
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const response = await fetch('/api/admin/configuracion')
        const data = await response.json()

        if (response.ok) {
          setConfiguracion(data)
        } else {
          console.error('Error al cargar configuración')
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
      }
    }

    cargarConfiguracion()
  }, [])

  // Cargar configuración de tickets
  useEffect(() => {
    const cargarTicketConfig = async () => {
      try {
        const response = await fetch('/api/tickets/config')
        const data = await response.json()

        if (response.ok) {
          setTicketConfig(data.config)
        } else {
          console.error('Error al cargar configuración de tickets')
        }
      } catch (error) {
        console.error('Error al cargar configuración de tickets:', error)
      }
    }

    cargarTicketConfig()
  }, [])

  // Manejar selección de sector (con verificación de horario)
  const handleSelectSector = (sector: Sector) => {
    const { activo, horarios } = verificarHorario(sector.horarios)
    
    if (!activo) {
      // Sector fuera de horario - mostrar mensaje
      setSectorNoDisponible({
        nombre: sector.nombre,
        horarios: horarios
      })
      setSelectedSector(null)
      return
    }
    
    // Sector activo - seleccionar normalmente
    setSelectedSector(sector)
    setSectorNoDisponible(null)
  }

  // Efecto para ocultar mensaje después de 15 segundos
  useEffect(() => {
    if (sectorNoDisponible) {
      const timer = setTimeout(() => {
        setSectorNoDisponible(null)
      }, 15000)
      
      return () => clearTimeout(timer)
    }
  }, [sectorNoDisponible])

  const handleNumberClick = (num: string) => {
    if (dni.length < 8) {
      setDni(dni + num)
    }
  }

  const handleDelete = () => {
    setDni(dni.slice(0, -1))
  }

  const handleClear = () => {
    setDni('')
    setSelectedSector(null)
    setTurnoAsignado(null)
    setSectorNoDisponible(null)
  }

  const handlePrint = (datos?: {
    numero: string
    sector: string
    dni: string
    hora: string
    color?: string
  }, silent: boolean = false) => {
    if (printing) return

    // Usar los datos pasados por parámetro o el estado
    const numero = datos?.numero || turnoAsignado?.numero || ''
    const sector = datos?.sector || turnoAsignado?.sector || ''
    const dni = datos?.dni || turnoAsignado?.dni || ''
    const hora = datos?.hora || turnoAsignado?.hora || ''

    setPrinting(true)

    // Usar configuración guardada o valores por defecto
    const config = ticketConfig || {
      papel: { ancho: 80, alto: 90, margen: 10 },
      logo: { visible: true, url: configuracion?.totemLogoUrl || '', ancho: 100, alto: 60, posicion: 'centro', margenInferior: 15 },
      tituloSector: { visible: true, tamaño: 22, negrita: true, posicion: 'centro', bordeInferior: true, margenInferior: 10 },
      numeroTurno: { tamaño: 60, negrita: true, colorFondo: '#000000', colorTexto: '#ffffff', borderRadius: 15, paddingX: 20, paddingY: 20, margenSuperior: 15, margenInferior: 15 },
      info: { visible: true, dni: { visible: true, etiqueta: 'DNI:', tamaño: 14 }, fecha: { visible: true, etiqueta: 'Fecha:', formato: 'dd/mm/yyyy', tamaño: 14 }, hora: { visible: true, etiqueta: 'Hora:', formato: '24h', tamaño: 14 }, alineacion: 'centro', margenSuperior: 15, interlineado: 1.8 },
      separador: { visible: true, estilo: 'dashed', grosor: 2, margenSuperior: 15, margenInferior: 15 },
      footer: { visible: true, lineas: ['Espere en la sala a ser llamado', '¡Gracias por su paciencia!'], tamaño: 11, alineacion: 'centro', margenSuperior: 15 },
      orden: ['logo', 'tituloSector', 'numeroTurno', 'separador-1', 'info', 'separador-2', 'footer']
    }

    try {
      // Crear una ventana nueva para imprimir el ticket
      const printWindow = window.open('', '', 'width=400,height=600')
      if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión')
      }

      const fecha = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      // Generar HTML basado en la configuración
      const getBorderStyle = (estilo: string) => {
        switch (estilo) {
          case 'dashed': return 'dashed'
          case 'dotted': return 'dotted'
          default: return 'solid'
        }
      }

      const getTextAlign = (posicion: string) => {
        switch (posicion) {
          case 'izquierda': return 'left'
          case 'derecha': return 'right'
          default: return 'center'
        }
      }

      const generateElements = () => {
        return config.orden.map((elemento: string, index: number) => {
          switch (elemento) {
            case 'logo':
              return config.logo.visible ? `
                <div style="text-align: ${getTextAlign(config.logo.posicion)}; margin-bottom: ${config.logo.margenInferior}px;">
                  ${config.logo.url ? `<img src="${config.logo.url}" alt="Logo" style="max-width: ${config.logo.ancho}px; max-height: ${config.logo.alto}px;" onerror="this.style.display='none'" />` : ''}
                </div>
              ` : ''
            case 'tituloSector':
              return config.tituloSector.visible ? `
                <div style="text-align: ${getTextAlign(config.tituloSector.posicion)}; margin-bottom: ${config.tituloSector.margenInferior}px; border-bottom: ${config.tituloSector.bordeInferior ? '2px solid #000' : 'none'}; padding-bottom: ${config.tituloSector.bordeInferior ? '10px' : '0'};">
                  <div style="font-size: ${config.tituloSector.tamaño}px; font-weight: ${config.tituloSector.negrita ? 'bold' : 'normal'};">${sector}</div>
                </div>
              ` : ''
            case 'numeroTurno':
              return `
                <div style="text-align: center; margin-top: ${config.numeroTurno.margenSuperior}px; margin-bottom: ${config.numeroTurno.margenInferior}px;">
                  <div style="display: inline-block; padding: ${config.numeroTurno.paddingY}px ${config.numeroTurno.paddingX}px; border-radius: ${config.numeroTurno.borderRadius}px; background-color: ${config.numeroTurno.colorFondo}; color: ${config.numeroTurno.colorTexto};">
                    <span style="font-size: ${config.numeroTurno.tamaño}px; font-weight: ${config.numeroTurno.negrita ? 'bold' : 'normal'};">${numero}</span>
                  </div>
                </div>
              `
            case 'separador':
            case 'separador-1':
            case 'separador-2':
              return config.separador.visible ? `
                <div style="border-top: ${config.separador.grosor}px ${getBorderStyle(config.separador.estilo)} #000; margin-top: ${config.separador.margenSuperior}px; margin-bottom: ${config.separador.margenInferior}px;"></div>
              ` : ''
            case 'info':
              return config.info.visible ? `
                <div style="text-align: ${getTextAlign(config.info.alineacion)}; margin-top: ${config.info.margenSuperior}px; line-height: ${config.info.interlineado};">
                  ${config.info.dni.visible ? `<div style="font-size: ${config.info.dni.tamaño}px;"><strong>${config.info.dni.etiqueta}</strong> ${dni}</div>` : ''}
                  ${config.info.fecha.visible ? `<div style="font-size: ${config.info.fecha.tamaño}px;"><strong>${config.info.fecha.etiqueta}</strong> ${fecha}</div>` : ''}
                  ${config.info.hora.visible ? `<div style="font-size: ${config.info.hora.tamaño}px;"><strong>${config.info.hora.etiqueta}</strong> ${hora}</div>` : ''}
                </div>
              ` : ''
            case 'footer':
              return config.footer.visible ? `
                <div style="text-align: ${getTextAlign(config.footer.alineacion)}; font-size: ${config.footer.tamaño}px; margin-top: ${config.footer.margenSuperior}px;">
                  ${config.footer.lineas.map((linea: string) => `<p>${linea}</p>`).join('')}
                </div>
              ` : ''
            default:
              return ''
          }
        }).join('')
      }

      // Escribir el HTML del ticket en la ventana
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket de Turno</title>
          <style>
            @page {
              size: ${config.papel.ancho}mm ${config.papel.alto}mm;
              margin: 0;
            }
            @media print {
              @page {
                size: ${config.papel.ancho}mm ${config.papel.alto}mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: ${config.papel.margen}px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              * {
                box-sizing: border-box;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              width: ${config.papel.ancho}mm;
              margin: 0 auto;
              padding: ${config.papel.margen}px;
            }
            p {
              margin: 0.5em 0;
            }
          </style>
        </head>
        <body>
          ${generateElements()}
        </body>
        </html>
      `)

      printWindow.document.close()

      // Esperar a que el documento se cargue antes de imprimir
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
        setPrinting(false)
      }

      // Timeout por seguridad
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close()
        }
        setPrinting(false)
      }, 3000)

      // Solo mostrar notificación si no es modo silencioso
      if (!silent) {
        toast({
          title: 'Ticket impreso',
          description: 'El ticket se ha enviado a la impresora',
        })
      }
    } catch (error) {
      console.error('Error al imprimir:', error)
      setPrinting(false)
      // Solo mostrar notificación de error si no es modo silencioso
      if (!silent) {
        toast({
          title: 'Error de impresión',
          description: 'No se pudo imprimir el ticket. Verifique que el navegador tenga permisos para imprimir.',
          variant: 'destructive'
        })
      }
    }
  }

  const handleSubmit = async () => {
    if (!dni || !selectedSector) return

    // Verificar horario antes de generar turno
    const { activo } = verificarHorario(selectedSector.horarios)
    if (!activo) {
      const { horarios } = verificarHorario(selectedSector.horarios)
      setSectorNoDisponible({
        nombre: selectedSector.nombre,
        horarios: horarios
      })
      setSelectedSector(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/turnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dni,
          sectorId: selectedSector.id
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const ahora = new Date()
        const datosTicket = {
          numero: data.numero,
          sector: data.sector.nombre,
          dni: formatDNI(dni),
          hora: ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          color: data.sector.color
        }

        setTurnoAsignado({
          ...datosTicket,
          color: data.sector.color
        })

        toast({
          title: '¡Turno generado!',
          description: `Su número es ${data.numero}. Espere en la sala.`,
        })

        // Imprimir el ticket automáticamente en segundo plano
        await handlePrint(datosTicket, true)

        // Limpiar formulario automáticamente después de 3 segundos para el próximo cliente
        setTimeout(() => {
          setDni('')
          setSelectedSector(null)
          setTurnoAsignado(null)
        }, 3000)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al generar turno',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error al generar turno:', error)
      toast({
        title: 'Error',
        description: 'Error al generar turno',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingSectores) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          {configuracion?.totemLogoUrl ? (
            <img
              src={configuracion.totemLogoUrl}
              alt="Logo Institución"
              className="h-20 md:h-24 mx-auto mb-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="inline-flex items-center gap-2 mb-2">
              <Clock className="w-8 h-8 text-primary" />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            {configuracion?.totemTitulo || 'Sistema de Turnos'}
          </h1>
          <p className="text-slate-600 text-lg">
            Seleccione su servicio y obtenga su número de espera
          </p>
        </header>

        {/* Mensaje de Sector No Disponible */}
        {sectorNoDisponible && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full shadow-2xl border-2 border-amber-500 animate-in fade-in zoom-in duration-300">
              <CardContent className="p-8 text-center">
                <div className="bg-amber-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                  Sector No Disponible
                </h2>
                <p className="text-lg text-slate-700 mb-2">
                  <strong>{sectorNoDisponible.nombre}</strong> no está atendiendo
                </p>
                <p className="text-slate-600 mb-4">
                  en este horario.
                </p>
                {sectorNoDisponible.horarios.length > 0 && (
                  <div className="bg-slate-100 rounded-lg p-4 mb-6">
                    <p className="text-sm text-slate-600 mb-2">Horario de atención:</p>
                    <p className="text-xl font-bold text-slate-900">
                      {formatearHorarios(sectorNoDisponible.horarios)}
                    </p>
                  </div>
                )}
                <p className="text-slate-500 text-sm">
                  Por favor, espere o seleccione otro servicio.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSectorNoDisponible(null)}
                >
                  Entendido
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Panel Izquierdo: Ingreso DNI */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Ingrese su DNI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display del DNI */}
              <div className="bg-slate-900 text-white rounded-lg p-4 text-center">
                <Input
                  type="text"
                  value={dni || '______'}
                  readOnly
                  className="text-3xl md:text-4xl font-mono text-center bg-transparent border-none text-white focus:ring-0"
                  placeholder="______"
                />
              </div>

              {/* Teclado Numérico */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="lg"
                    className="h-16 text-2xl font-semibold hover:bg-slate-100 transition-colors"
                    onClick={() => handleNumberClick(num.toString())}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-16 text-lg font-semibold"
                  onClick={handleClear}
                  disabled={!dni}
                >
                  Limpiar
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 text-2xl font-semibold hover:bg-slate-100 transition-colors"
                  onClick={() => handleNumberClick('0')}
                >
                  0
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-16 text-lg font-semibold"
                  onClick={handleDelete}
                  disabled={!dni}
                >
                  ←
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Panel Derecho: Selección de Sector */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Seleccione el Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de Sectores */}
              <div className="grid gap-3">
                {sectores.map((sector) => {
                  const { activo: enHorario, horarios: horariosSector } = verificarHorario(sector.horarios)
                  
                  return (
                    <Button
                      key={sector.id}
                      variant={selectedSector?.id === sector.id ? 'default' : 'outline'}
                      size="lg"
                      className={cn(
                        "h-auto text-lg font-semibold justify-start px-6 transition-all py-4",
                        selectedSector?.id === sector.id && "shadow-lg scale-105",
                        !enHorario && "opacity-60"
                      )}
                      style={
                        selectedSector?.id === sector.id
                          ? { backgroundColor: sector.color, color: 'white', borderColor: sector.color }
                          : { borderColor: sector.color, color: sector.color }
                      }
                      onClick={() => handleSelectSector(sector)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: sector.color }}
                          />
                          <div className="text-left">
                            <span>{sector.nombre}</span>
                            {!enHorario && horariosSector.length > 0 && (
                              <div className="text-xs opacity-70 mt-0.5 flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Fuera de horario
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedSector?.id === sector.id && (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                    </Button>
                  )
                })}
              </div>

              {/* Botón Generar Turno */}
              <Button
                size="lg"
                className="w-full h-16 text-lg font-semibold mt-6"
                disabled={!dni || !selectedSector || loading || !!turnoAsignado}
                onClick={handleSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    Generar Turno
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Generado */}
        {turnoAsignado && (
          <Card className="mt-6 shadow-2xl border-2 border-primary">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                ¡Turno Generado con Éxito!
              </h2>
              <div className="bg-white rounded-lg p-6 shadow-inner max-w-md mx-auto">
                <p className="text-slate-600 mb-2">Su número de turno es:</p>
                <div className="text-6xl font-bold text-primary mb-4">
                  {turnoAsignado.numero}
                </div>
                <div
                  className="inline-block px-6 py-2 rounded-full text-white font-semibold"
                  style={{ backgroundColor: turnoAsignado.color }}
                >
                  {turnoAsignado.sector}
                </div>
              </div>
              <p className="text-slate-600 mt-6">
                Por favor, espere en la sala de espera a ser llamado
              </p>
              <Button
                variant="outline"
                size="lg"
                className="mt-6"
                onClick={() => handlePrint({
                  numero: turnoAsignado.numero,
                  sector: turnoAsignado.sector,
                  dni: turnoAsignado.dni,
                  hora: turnoAsignado.hora,
                  color: turnoAsignado.color
                })}
                disabled={printing}
              >
                {printing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Imprimiendo...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    Reimprimir Ticket
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
