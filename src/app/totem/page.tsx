'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Clock, CheckCircle2, ArrowRight, User, Loader2, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Sector {
  id: string
  nombre: string
  color: string
  activo: boolean
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

  // Cargar configuración
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
    const color = datos?.color || turnoAsignado?.color || '#1e40af'

    setPrinting(true)

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

      // Escribir el HTML del ticket en la ventana
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Ticket de Turno</title>
          <style>
            @page {
              size: 80mm 90mm;
              margin: 0;
            }
            @media print {
              @page {
                size: 80mm 90mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 10px;
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
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .sector-title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .content {
              text-align: center;
              margin: 20px 0;
            }
            .ticket-number {
              font-size: 60px;
              font-weight: bold;
              margin: 15px 0;
            }
            .ticket-box {
              display: inline-block;
              padding: 20px 20px;
              border-radius: 15px;
              background-color: #000;
              color: white;
              margin: 15px 0;
            }
            .info {
              text-align: center;
              margin: 15px 0;
              line-height: 1.8;
              font-size: 14px;
            }
            .logo-img {
              max-width: 100px;
              max-height: 60px;
              object-fit: contain;
            }
            .divider {
              border-top: 2px dashed #000;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          ${configuracion?.totemLogoUrl ? `
          <div class="header-logo" style="text-align: center; margin-bottom: 15px;">
            <img class="logo-img" src="${configuracion.totemLogoUrl}" alt="Logo Institución" onerror="this.style.display='none'" />
          </div>
          ` : ''}
          <div class="header">
            <div class="sector-title">${sector}</div>
          </div>
          <div class="content">
            <div class="ticket-box">
              <div class="ticket-number">${numero}</div>
            </div>
          </div>
          <div class="info">
            <div><strong>DNI:</strong> ${dni}</div>
            <div><strong>Fecha:</strong> ${fecha}</div>
            <div><strong>Hora:</strong> ${hora}</div>
          </div>
          <div class="divider"></div>
          <div class="footer">
            <p>Espere en la sala a ser llamado</p>
            <p>¡Gracias por su paciencia!</p>
          </div>
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
                {sectores.map((sector) => (
                  <Button
                    key={sector.id}
                    variant={selectedSector?.id === sector.id ? 'default' : 'outline'}
                    size="lg"
                    className={cn(
                      "h-16 text-lg font-semibold justify-start px-6 transition-all",
                      selectedSector?.id === sector.id && "shadow-lg scale-105"
                    )}
                    style={
                      selectedSector?.id === sector.id
                        ? { backgroundColor: sector.color, color: 'white', borderColor: sector.color }
                        : { borderColor: sector.color, color: sector.color }
                    }
                    onClick={() => setSelectedSector(sector)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className="flex-1 text-left">{sector.nombre}</span>
                      {selectedSector?.id === sector.id && (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                  </Button>
                ))}
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
