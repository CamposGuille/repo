'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Clock, CheckCircle2, ArrowRight, User, Loader2, Printer, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Sector {
  id: string
  nombre: string
  color: string
  activo: boolean
}

interface Printer {
  vendorId: number
  productId: number
  index: number
}

// Funcion para formatear DNI con puntos (xx.xxx.xxx)
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
  const [showPrinterDialog, setShowPrinterDialog] = useState(false)
  const [printers, setPrinters] = useState<Printer[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null)
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const { toast } = useToast()

  // Cargar impresoras disponibles
  const loadPrinters = async () => {
    setLoadingPrinters(true)
    try {
      const response = await fetch('/api/impresoras?XTransformPort=3004')
      const data = await response.json()

      if (response.ok && data.printers) {
        setPrinters(data.printers)
        setSelectedPrinter(data.selected !== -1 ? data.printers[data.selected] : null)
      }
    } catch (error) {
      console.error('Error al cargar impresoras:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar la lista de impresoras',
        variant: 'destructive'
      })
    } finally {
      setLoadingPrinters(false)
    }
  }

  // Seleccionar impresora
  const selectPrinter = async (printer: Printer) => {
    try {
      const response = await fetch('/api/impresoras/seleccionar?XTransformPort=3004', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ index: printer.index }),
      })

      const result = await response.json()

      if (result.success) {
        setSelectedPrinter(printer)
        setShowPrinterDialog(false)
        toast({
          title: 'Impresora seleccionada',
          description: 'Impresora configurada correctamente',
        })
      }
    } catch (error) {
      console.error('Error al seleccionar impresora:', error)
      toast({
        title: 'Error',
        description: 'No se pudo seleccionar la impresora',
        variant: 'destructive'
      })
    }
  }

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

  const handlePrint = async (datos?: {
    numero: string
    sector: string
    dni: string
    hora: string
  }) => {
    if (printing) return

    const numero = datos?.numero || turnoAsignado?.numero || ''
    const sector = datos?.sector || turnoAsignado?.sector || ''
    const dni = datos?.dni || turnoAsignado?.dni || ''
    const hora = datos?.hora || turnoAsignado?.hora || ''

    setPrinting(true)

    try {
      // Llamar al servicio de impresión local
      const response = await fetch('/api/imprimir?XTransformPort=3004', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'TICKET DE TURNO',
          turno: {
            numero,
            sector,
            fecha: new Date().toLocaleDateString('es-AR'),
            hora,
          },
          footer: 'Espere en la sala a ser llamado. ¡Gracias por su paciencia!',
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Ticket impreso',
          description: 'El ticket se ha impreso correctamente',
        })
      } else {
        // Mostrar error del servicio o un mensaje genérico
        toast({
          title: 'Error de impresión',
          description: result.error || 'No se pudo imprimir el ticket',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error al imprimir:', error)
      toast({
        title: 'Error de impresión',
        description: 'No se pudo imprimir el ticket. Verifique que el servicio de impresión esté activo.',
        variant: 'destructive'
      })
    } finally {
      setPrinting(false)
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
          hora: ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        }

        setTurnoAsignado({
          ...datosTicket,
          color: data.sector.color
        })

        toast({
          title: '¡Turno generado!',
          description: `Su número es ${data.numero}. Espere en la sala.`,
        })

        // Imprimir el ticket automáticamente
        await handlePrint(datosTicket)

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
          <div className="inline-flex items-center gap-2 mb-2">
            <Clock className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Sistema de Turnos
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPrinterDialog(true)}
              className="ml-4"
              title="Configurar impresora"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-slate-600 text-lg">
            Seleccione su servicio y obtenga su número de espera
          </p>
          {selectedPrinter && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <Printer className="w-4 h-4" />
              <span>Impresora configurada</span>
            </div>
          )}
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
                  hora: turnoAsignado.hora
                })}
                disabled={printing}
              >
                {printing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Imprimiendo...
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5 mr-2" />
                    Reimprimir Ticket
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de selección de impresora */}
      {showPrinterDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5" />
                  Seleccionar Impresora
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPrinterDialog(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrinters ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-600">Buscando impresoras...</p>
                </div>
              ) : printers.length === 0 ? (
                <div className="text-center py-12">
                  <Printer className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-600 mb-2">No se detectaron impresoras</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Asegúrese de que la impresora esté conectada y encendida, y que el servicio de impresión esté corriendo en el puerto 3004.
                  </p>
                  <Button
                    onClick={loadPrinters}
                    className="w-full"
                  >
                    Reintentar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {printers.map((printer, index) => (
                    <Button
                      key={index}
                      variant={selectedPrinter?.index === index ? 'default' : 'outline'}
                      className={cn(
                        "w-full justify-start text-left h-auto py-4",
                        selectedPrinter?.index === index && "border-2 border-primary bg-primary/10"
                      )}
                      onClick={() => selectPrinter(printer)}
                    >
                      <div className="flex items-start w-full">
                        <Printer className="w-5 h-5 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold">
                            Impresora {index + 1}
                          </div>
                          <div className="text-sm text-slate-600">
                            Vendor ID: 0x{printer.vendorId.toString(16).toUpperCase()}
                          </div>
                          <div className="text-sm text-s600">
                            Product ID: 0x{printer.productId.toString(16).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
