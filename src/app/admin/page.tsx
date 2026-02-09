'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, LogOut, Users, Building2, BarChart3, Plus, Edit2, Trash2, X, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Admin {
  id: string
  username: string
  nombre: string
  activo: boolean
}

interface OperadorSector {
  id: string
  sector: {
    id: string
    nombre: string
    color: string
  }
}

interface Operador {
  id: string
  username: string
  nombre: string
  activo: boolean
  sectores: OperadorSector[]
}

interface Sector {
  id: string
  nombre: string
  color: string
  activo: boolean
  numeroTurno: number
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('estadisticas')
  const { toast } = useToast()

  // Estado para operadores
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [loadingOperadores, setLoadingOperadores] = useState(false)
  const [editOperador, setEditOperador] = useState<Operador | null>(null)
  const [operadorDialogOpen, setOperadorDialogOpen] = useState(false)
  const [operadorForm, setOperadorForm] = useState({ username: '', password: '', nombre: '', sectorIds: [] as string[], activo: true })

  // Estado para sectores
  const [sectores, setSectores] = useState<Sector[]>([])
  const [loadingSectores, setLoadingSectores] = useState(false)
  const [editSector, setEditSector] = useState<Sector | null>(null)
  const [sectorDialogOpen, setSectorDialogOpen] = useState(false)
  const [sectorForm, setSectorForm] = useState({ nombre: '', color: '#10b981', activo: true })

  // Estado para estadísticas
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false)

  // Estado para configuración
  const [configuracion, setConfiguracion] = useState<{
    titulo: string
    subtitulo: string
    descripcion: string
    monitorId?: string
    totemTitulo: string
    totemDescripcion: string
    totemInstrucciones: string
    monitorTitulo: string
    monitorSubtitulo: string
    monitorPie: string
    operadorTitulo: string
    operadorInstrucciones: string
    ticketLogoUrl?: string
    ticketEncabezado: string
    ticketPie: string
    ticketColorPrimario: string
    ticketMostrarFecha: boolean
    ticketMostrarHora: boolean
    ticketMostrarOperador: boolean
  } | null>(null)
  const [loadingConfiguracion, setLoadingConfiguracion] = useState(false)
  const [configForm, setConfigForm] = useState({
    titulo: '',
    subtitulo: '',
    descripcion: '',
    monitorId: '',
    totemTitulo: '',
    totemDescripcion: '',
    totemInstrucciones: '',
    monitorTitulo: '',
    monitorSubtitulo: '',
    monitorPie: '',
    operadorTitulo: '',
    operadorInstrucciones: '',
    ticketLogoUrl: '',
    ticketEncabezado: '',
    ticketPie: '',
    ticketColorPrimario: '',
    ticketMostrarFecha: true,
    ticketMostrarHora: true,
    ticketMostrarOperador: true
  })

  // Estado para monitores
  const [monitores, setMonitores] = useState<any[]>([])
  const [loadingMonitores, setLoadingMonitores] = useState(false)
  const [editMonitor, setEditMonitor] = useState<any>(null)
  const [monitorDialogOpen, setMonitorDialogOpen] = useState(false)
  const [monitorForm, setMonitorForm] = useState({ nombre: '', descripcion: '', sectorIds: [] as string[], activo: true })

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error en el login')
      }

      setIsAuthenticated(true)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Error en el login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  // Cargar operadores
  const cargarOperadores = async () => {
    setLoadingOperadores(true)
    try {
      const response = await fetch('/api/admin/operadores')
      const data = await response.json()
      if (response.ok) setOperadores(data)
    } catch (error) {
      console.error('Error al cargar operadores:', error)
    } finally {
      setLoadingOperadores(false)
    }
  }

  // Guardar operador (crear o editar)
  const guardarOperador = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que haya al menos un sector seleccionado
    if (!operadorForm.sectorIds || operadorForm.sectorIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar al menos un sector',
        variant: 'destructive',
      })
      return
    }

    // Limpiar el ID si tiene sufijo de versión (ej: ":1")
    const cleanId = editOperador?.id?.split(':')[0] || ''
    const url = editOperador ? `/api/admin/operadores/${cleanId}` : '/api/admin/operadores'
    const method = editOperador ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operadorForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: '¡Éxito!',
          description: editOperador ? 'Operador actualizado correctamente' : 'Operador creado correctamente',
        })
        // Cerrar diálogo y limpiar formulario
        setOperadorDialogOpen(false)
        setEditOperador(null)
        setOperadorForm({ username: '', password: '', nombre: '', sectorIds: [], activo: true })
        cargarOperadores()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar operador',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al guardar operador:', error)
      toast({
        title: 'Error',
        description: 'Error de conexión al guardar operador',
        variant: 'destructive',
      })
    }
  }

  // Preparar operador para edición
  const prepararEdicionOperador = (operador: Operador) => {
    setOperadorForm({
      username: operador.username,
      password: '', // No mostramos la contraseña existente
      nombre: operador.nombre,
      sectorIds: operador.sectores?.map((os: OperadorSector) => os.sector.id) || [],
      activo: operador.activo
    })
    setEditOperador(operador)
    setOperadorDialogOpen(true)
  }

  const eliminarOperador = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este operador?')) return

    // Limpiar el ID si tiene sufijo de versión (ej: ":1")
    const cleanId = id.split(':')[0]

    try {
      const response = await fetch(`/api/admin/operadores/${cleanId}`, { method: 'DELETE' })

      if (response.ok) {
        toast({ title: '¡Éxito!', description: 'Operador eliminado' })
        cargarOperadores()
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar operador',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al eliminar operador:', error)
    }
  }

  // Cargar sectores
  const cargarSectores = async () => {
    setLoadingSectores(true)
    try {
      const response = await fetch('/api/admin/sectores')
      const data = await response.json()
      if (response.ok) setSectores(data)
    } catch (error) {
      console.error('Error al cargar sectores:', error)
    } finally {
      setLoadingSectores(false)
    }
  }

  // Guardar sector (crear o editar)
  const guardarSector = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpiar el ID si tiene sufijo de versión (ej: ":1")
    const cleanId = editSector?.id?.split(':')[0] || ''
    const url = editSector ? `/api/admin/sectores/${cleanId}` : '/api/admin/sectores'
    const method = editSector ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectorForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: '¡Éxito!',
          description: editSector ? 'Sector actualizado correctamente' : 'Sector creado correctamente',
        })
        // Cerrar diálogo y limpiar formulario
        setSectorDialogOpen(false)
        setEditSector(null)
        setSectorForm({ nombre: '', color: '#10b981', activo: true })
        cargarSectores()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar sector',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al guardar sector:', error)
      toast({
        title: 'Error',
        description: 'Error de conexión al guardar sector',
        variant: 'destructive',
      })
    }
  }

  // Preparar sector para edición
  const prepararEdicionSector = (sector: Sector) => {
    setSectorForm({
      nombre: sector.nombre,
      color: sector.color,
      activo: sector.activo
    })
    setEditSector(sector)
    setSectorDialogOpen(true)
  }

  const eliminarSector = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este sector?')) return

    // Limpiar el ID si tiene sufijo de versión (ej: ":1")
    const cleanId = id.split(':')[0]

    try {
      const response = await fetch(`/api/admin/sectores/${cleanId}`, { method: 'DELETE' })

      if (response.ok) {
        toast({ title: '¡Éxito!', description: 'Sector eliminado' })
        cargarSectores()
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar sector',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al eliminar sector:', error)
    }
  }

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    setLoadingEstadisticas(true)
    try {
      const response = await fetch('/api/admin/estadisticas')
      const data = await response.json()
      if (response.ok) setEstadisticas(data)
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoadingEstadisticas(false)
    }
  }

  // Cargar configuración
  const cargarConfiguracion = async () => {
    setLoadingConfiguracion(true)
    try {
      const response = await fetch('/api/admin/configuracion')
      const data = await response.json()
      if (response.ok) {
        setConfiguracion(data)
        setConfigForm({
          titulo: data.titulo,
          subtitulo: data.subtitulo,
          descripcion: data.descripcion,
          monitorId: data.monitorId || '',
          totemTitulo: data.totemTitulo || '',
          totemDescripcion: data.totemDescripcion || '',
          totemInstrucciones: data.totemInstrucciones || '',
          monitorTitulo: data.monitorTitulo || '',
          monitorSubtitulo: data.monitorSubtitulo || '',
          monitorPie: data.monitorPie || '',
          operadorTitulo: data.operadorTitulo || '',
          operadorInstrucciones: data.operadorInstrucciones || '',
          ticketLogoUrl: data.ticketLogoUrl || '',
          ticketEncabezado: data.ticketEncabezado || '',
          ticketPie: data.ticketPie || '',
          ticketColorPrimario: data.ticketColorPrimario || '',
          ticketMostrarFecha: data.ticketMostrarFecha !== undefined ? data.ticketMostrarFecha : true,
          ticketMostrarHora: data.ticketMostrarHora !== undefined ? data.ticketMostrarHora : true,
          ticketMostrarOperador: data.ticketMostrarOperador !== undefined ? data.ticketMostrarOperador : true
        })
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoadingConfiguracion(false)
    }
  }

  // Cargar monitores
  const cargarMonitores = async () => {
    setLoadingMonitores(true)
    try {
      const response = await fetch('/api/admin/monitores')
      const data = await response.json()
      if (response.ok) setMonitores(data)
    } catch (error) {
      console.error('Error al cargar monitores:', error)
    } finally {
      setLoadingMonitores(false)
    }
  }

  // Guardar monitor (crear o editar)
  const guardarMonitor = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editMonitor ? `/api/admin/monitores/${editMonitor.id}` : '/api/admin/monitores'
    const method = editMonitor ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitorForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: '¡Éxito!',
          description: editMonitor ? 'Monitor actualizado' : 'Monitor creado',
        })
        setMonitorDialogOpen(false)
        setEditMonitor(null)
        setMonitorForm({ nombre: '', descripcion: '', sectorIds: [], activo: true })
        cargarMonitores()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar monitor',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al guardar monitor:', error)
    }
  }

  const prepararEdicionMonitor = (monitor: any) => {
    setMonitorForm({
      nombre: monitor.nombre,
      descripcion: monitor.descripcion || '',
      sectorIds: monitor.sectores?.map((ms: any) => ms.sector.id) || [],
      activo: monitor.activo
    })
    setEditMonitor(monitor)
    setMonitorDialogOpen(true)
  }

  const eliminarMonitor = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este monitor?')) return

    try {
      const response = await fetch(`/api/admin/monitores/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: '¡Éxito!', description: 'Monitor eliminado' })
        cargarMonitores()
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al eliminar monitor',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al eliminar monitor:', error)
    }
  }

  // Guardar configuración
  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm),
      })

      if (response.ok) {
        toast({
          title: '¡Éxito!',
          description: 'Configuración actualizada',
        })
        cargarConfiguracion()
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.error || 'Error al guardar configuración',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      cargarOperadores()
      cargarSectores()
      cargarEstadisticas()
      cargarConfiguracion()
      cargarMonitores()
    }
  }, [isAuthenticated])

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <p className="text-slate-600">Ingrese sus credenciales para acceder</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-slate-600 mt-1">Gestión del sistema de turnos</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="estadisticas">
              <BarChart3 className="w-4 h-4 mr-2" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="usuarios">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="servicios">
              <Building2 className="w-4 h-4 mr-2" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="configuracion">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <BarChart3 className="w-4 h-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="monitores">
              <Building2 className="w-4 h-4 mr-2" />
              Monitores
            </TabsTrigger>
          </TabsList>

          {/* Tab Estadísticas */}
          <TabsContent value="estadisticas" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Estadísticas</h2>
              <Button
                onClick={async () => {
                  if (!confirm('¿Está seguro de limpiar los turnos atrapados (llamados y atendiendo)?')) return
                  try {
                    const response = await fetch('/api/admin/turnos/limpiar', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estados: ['llamado', 'atendiendo'] })
                    })
                    const data = await response.json()
                    if (response.ok) {
                      toast({
                        title: '¡Éxito!',
                        description: `Se eliminaron ${data.cantidadEliminada} turnos atrapados`
                      })
                      cargarEstadisticas()
                    } else {
                      toast({
                        title: 'Error',
                        description: data.error || 'Error al limpiar turnos',
                        variant: 'destructive'
                      })
                    }
                  } catch (error) {
                    console.error('Error al limpiar turnos:', error)
                    toast({
                      title: 'Error',
                      description: 'Error de conexión al limpiar turnos',
                      variant: 'destructive'
                    })
                  }
                }}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar Turnos Atrapados
              </Button>
            </div>

            {loadingEstadisticas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : estadisticas ? (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Total Turnos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{estadisticas.resumen.totalTurnos}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Finalizados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{estadisticas.resumen.turnosFinalizados}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">En Espera</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">{estadisticas.resumen.turnosEnEspera}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Ausentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{estadisticas.resumen.turnosAusentes}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tiempos Promedio */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Tiempo Promedio de Espera</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">
                        {estadisticas.resumen.tiempoEsperaPromedio} min
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">Tiempo Promedio de Atención</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">
                        {estadisticas.resumen.tiempoAtencionPromedio} min
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Por Sector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Turnos por Sector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(estadisticas.porSector).map(([nombre, datos]: [string, any]) => (
                        <div key={nombre} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: datos.color }}
                            />
                            <span className="font-medium">{nombre}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{datos.total}</div>
                            <div className="text-sm text-slate-600">
                              {datos.finalizados} finalizados, {datos.ausentes} ausentes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Por Operador */}
                <Card>
                  <CardHeader>
                    <CardTitle>Turnos por Operador</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {Object.entries(estadisticas.porOperador).map(([nombre, datos]: [string, any]) => (
                        <div key={nombre} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <span className="font-medium">{nombre}</span>
                          <div className="text-right">
                            <div className="text-lg font-bold">{datos.total}</div>
                            <div className="text-sm text-slate-600">
                              {datos.finalizados} finalizados, {datos.ausentes} ausentes
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No hay datos disponibles</p>
              </div>
            )}
          </TabsContent>

          {/* Tab Usuarios */}
          <TabsContent value="usuarios" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Gestión de Operadores</h2>
              <Dialog open={operadorDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setEditOperador(null)
                  setOperadorForm({ username: '', password: '', nombre: '', sectorIds: [], activo: true })
                }
                setOperadorDialogOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditOperador(null)
                    setOperadorForm({ username: '', password: '', nombre: '', sectorIds: [], activo: true })
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Operador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editOperador ? 'Editar Operador' : 'Nuevo Operador'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={guardarOperador} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre de Usuario</Label>
                      <Input
                        value={operadorForm.username}
                        onChange={(e) => setOperadorForm({ ...operadorForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña {editOperador ? '(dejar vacío para mantener)' : ''}</Label>
                      <Input
                        type="password"
                        value={operadorForm.password}
                        onChange={(e) => setOperadorForm({ ...operadorForm, password: e.target.value })}
                        required={!editOperador}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input
                        value={operadorForm.nombre}
                        onChange={(e) => setOperadorForm({ ...operadorForm, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sectores</Label>
                      <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                        {sectores.map((sector) => (
                          <div key={sector.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`op-sector-${sector.id}`}
                              checked={operadorForm.sectorIds.includes(sector.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOperadorForm({
                                    ...operadorForm,
                                    sectorIds: [...operadorForm.sectorIds, sector.id]
                                  })
                                } else {
                                  setOperadorForm({
                                    ...operadorForm,
                                    sectorIds: operadorForm.sectorIds.filter(id => id !== sector.id)
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`op-sector-${sector.id}`} className="text-sm cursor-pointer">
                              {sector.nombre}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={operadorForm.activo}
                        onCheckedChange={(checked) => setOperadorForm({ ...operadorForm, activo: checked })}
                      />
                      <Label>Activo</Label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="submit">{editOperador ? 'Actualizar' : 'Crear'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loadingOperadores ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {operadores.map((operador) => (
                      <div key={operador.id} className="flex flex-col gap-2 p-4 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{operador.nombre}</div>
                            <div className="text-sm text-slate-600">@{operador.username}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${operador.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {operador.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            <Button size="icon" variant="ghost" onClick={() => prepararEdicionOperador(operador)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => eliminarOperador(operador.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {operador.sectores && operador.sectores.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {operador.sectores.map((os: OperadorSector) => (
                              <span
                                key={os.sector.id}
                                className="px-2 py-1 rounded text-xs text-white"
                                style={{ backgroundColor: os.sector.color }}
                              >
                                {os.sector.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Servicios */}
          <TabsContent value="servicios" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Gestión de Sectores</h2>
              <Dialog open={sectorDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setEditSector(null)
                  setSectorForm({ nombre: '', color: '#10b981', activo: true })
                }
                setSectorDialogOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditSector(null)
                    setSectorForm({ nombre: '', color: '#10b981', activo: true })
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Sector
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editSector ? 'Editar Sector' : 'Nuevo Sector'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={guardarSector} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre del Sector</Label>
                      <Input
                        value={sectorForm.nombre}
                        onChange={(e) => setSectorForm({ ...sectorForm, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={sectorForm.color}
                          onChange={(e) => setSectorForm({ ...sectorForm, color: e.target.value })}
                          className="w-20 h-10"
                          required
                        />
                        <Input
                          value={sectorForm.color}
                          onChange={(e) => setSectorForm({ ...sectorForm, color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={sectorForm.activo}
                        onCheckedChange={(checked) => setSectorForm({ ...sectorForm, activo: checked })}
                      />
                      <Label>Activo</Label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="submit">{editSector ? 'Actualizar' : 'Crear'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loadingSectores ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {sectores.map((sector) => (
                      <div key={sector.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: sector.color }}
                          />
                          <div>
                            <div className="font-semibold">{sector.nombre}</div>
                            <div className="text-sm text-slate-600">Turno actual: {sector.numeroTurno}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${sector.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {sector.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <Button size="icon" variant="ghost" onClick={() => prepararEdicionSector(sector)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => eliminarSector(sector.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Configuración */}
          <TabsContent value="configuracion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <p className="text-sm text-slate-600">
                  Personalice los textos que se muestran en todas las páginas del sistema
                </p>
              </CardHeader>
              <CardContent>
                {loadingConfiguracion ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                ) : (
                  <form onSubmit={guardarConfiguracion} className="space-y-6 max-w-2xl">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título Principal</Label>
                      <Input
                        id="titulo"
                        value={configForm.titulo}
                        onChange={(e) => setConfigForm({ ...configForm, titulo: e.target.value })}
                        placeholder="Sistema de Turnos"
                        required
                      />
                      <p className="text-sm text-slate-500">
                        Este título se muestra en el encabezado y página principal
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subtitulo">Subtítulo</Label>
                      <Input
                        id="subtitulo"
                        value={configForm.subtitulo}
                        onChange={(e) => setConfigForm({ ...configForm, subtitulo: e.target.value })}
                        placeholder="Plataforma de autogestión y atención"
                        required
                      />
                      <p className="text-sm text-slate-500">
                        Texto descriptivo que aparece debajo del título
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <textarea
                        id="descripcion"
                        value={configForm.descripcion}
                        onChange={(e) => setConfigForm({ ...configForm, descripcion: e.target.value })}
                        placeholder="Seleccione la opción según su rol en el sistema"
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      />
                      <p className="text-sm text-slate-500">
                        Texto de bienvenida que se muestra en la página principal
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monitor">Monitor Principal</Label>
                      <Select
                        value={configForm.monitorId || undefined}
                        onValueChange={(value) => setConfigForm({ ...configForm, monitorId: value || '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un monitor" />
                        </SelectTrigger>
                        <SelectContent>
                          {monitores.map((monitor) => (
                            <SelectItem key={monitor.id} value={monitor.id}>
                              {monitor.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-slate-500">
                        Monitor que se muestra por defecto en la página de turnos. Dejar vacío para no seleccionar ninguno.
                      </p>
                    </div>

                    {/* Textos del Tótem */}
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-slate-900">Textos del Tótem de Autogestión</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totemTitulo">Título del Tótem</Label>
                      <Input
                        id="totemTitulo"
                        value={configForm.totemTitulo}
                        onChange={(e) => setConfigForm({ ...configForm, totemTitulo: e.target.value })}
                        placeholder="Tótem de Autogestión"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totemDescripcion">Descripción</Label>
                      <textarea
                        id="totemDescripcion"
                        value={configForm.totemDescripcion}
                        onChange={(e) => setConfigForm({ ...configForm, totemDescripcion: e.target.value })}
                        placeholder="Para clientes que deseen sacar un turno"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totemInstrucciones">Instrucciones</Label>
                      <textarea
                        id="totemInstrucciones"
                        value={configForm.totemInstrucciones}
                        onChange={(e) => setConfigForm({ ...configForm, totemInstrucciones: e.target.value })}
                        placeholder="Ingrese su DNI y seleccione el servicio correspondiente"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    {/* Textos del Monitor */}
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-slate-900">Textos del Monitor de Turnos</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monitorTitulo">Título del Monitor</Label>
                      <Input
                        id="monitorTitulo"
                        value={configForm.monitorTitulo}
                        onChange={(e) => setConfigForm({ ...configForm, monitorTitulo: e.target.value })}
                        placeholder="Monitor de Turnos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monitorSubtitulo">Subtítulo</Label>
                      <Input
                        id="monitorSubtitulo"
                        value={configForm.monitorSubtitulo}
                        onChange={(e) => setConfigForm({ ...configForm, monitorSubtitulo: e.target.value })}
                        placeholder="Espere en la sala a ser llamado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monitorPie">Texto del pie de página</Label>
                      <textarea
                        id="monitorPie"
                        value={configForm.monitorPie}
                        onChange={(e) => setConfigForm({ ...configForm, monitorPie: e.target.value })}
                        placeholder="Por favor, preste atención a los anuncios en voz alta"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    {/* Textos del Operador */}
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold mb-4 text-slate-900">Textos del Panel de Operador</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operadorTitulo">Título del Panel</Label>
                      <Input
                        id="operadorTitulo"
                        value={configForm.operadorTitulo}
                        onChange={(e) => setConfigForm({ ...configForm, operadorTitulo: e.target.value })}
                        placeholder="Panel del Operador"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operadorInstrucciones">Instrucciones</Label>
                      <textarea
                        id="operadorInstrucciones"
                        value={configForm.operadorInstrucciones}
                        onChange={(e) => setConfigForm({ ...configForm, operadorInstrucciones: e.target.value })}
                        placeholder="Seleccione un sector para comenzar a atender"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <Button type="submit" size="lg">
                        Guardar Cambios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={cargarConfiguracion}
                      >
                        Restablecer
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Tickets */}
          <TabsContent value="tickets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={guardarConfiguracion} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personalización del Ticket</h3>
                    <div className="space-y-2">
                      <Label htmlFor="ticketLogoUrl">URL del Logo Personalizado</Label>
                      <Input
                        id="ticketLogoUrl"
                        value={configForm.ticketLogoUrl}
                        onChange={(e) => setConfigForm({ ...configForm, ticketLogoUrl: e.target.value })}
                        placeholder="https://ejemplo.com/logo.png"
                      />
                      <p className="text-sm text-slate-500">Ingrese la URL completa de la imagen del logo</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticketEncabezado">Encabezado del Ticket</Label>
                      <Input
                        id="ticketEncabezado"
                        value={configForm.ticketEncabezado}
                        onChange={(e) => setConfigForm({ ...configForm, ticketEncabezado: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticketPie">Pie de Página del Ticket</Label>
                      <Input
                        id="ticketPie"
                        value={configForm.ticketPie}
                        onChange={(e) => setConfigForm({ ...configForm, ticketPie: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticketColorPrimario">Color Primario</Label>
                      <div className="flex gap-2">
                        <Input
                          id="ticketColorPrimario"
                          type="color"
                          value={configForm.ticketColorPrimario}
                          onChange={(e) => setConfigForm({ ...configForm, ticketColorPrimario: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={configForm.ticketColorPrimario}
                          onChange={(e) => setConfigForm({ ...configForm, ticketColorPrimario: e.target.value })}
                          placeholder="#1e40af"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Elementos a Mostrar</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ticketMostrarFecha"
                        checked={configForm.ticketMostrarFecha}
                        onCheckedChange={(checked) => setConfigForm({ ...configForm, ticketMostrarFecha: checked })}
                      />
                      <Label htmlFor="ticketMostrarFecha">Mostrar Fecha</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ticketMostrarHora"
                        checked={configForm.ticketMostrarHora}
                        onCheckedChange={(checked) => setConfigForm({ ...configForm, ticketMostrarHora: checked })}
                      />
                      <Label htmlFor="ticketMostrarHora">Mostrar Hora</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="ticketMostrarOperador"
                        checked={configForm.ticketMostrarOperador}
                        onCheckedChange={(checked) => setConfigForm({ ...configForm, ticketMostrarOperador: checked })}
                      />
                      <Label htmlFor="ticketMostrarOperador">Mostrar Operador</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="submit">Guardar Configuración</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Monitores */}
          <TabsContent value="monitores" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Gestión de Monitores</h2>
              <Dialog open={monitorDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setEditMonitor(null)
                  setMonitorForm({ nombre: '', descripcion: '', sectorIds: [], activo: true })
                }
                setMonitorDialogOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditMonitor(null)
                    setMonitorForm({ nombre: '', descripcion: '', sectorIds: [], activo: true })
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Monitor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editMonitor ? 'Editar Monitor' : 'Nuevo Monitor'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={guardarMonitor} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre del Monitor</Label>
                      <Input
                        value={monitorForm.nombre}
                        onChange={(e) => setMonitorForm({ ...monitorForm, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={monitorForm.descripcion}
                        onChange={(e) => setMonitorForm({ ...monitorForm, descripcion: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sectores Asignados</Label>
                      <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                        {sectores.map((sector) => (
                          <div key={sector.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`sector-${sector.id}`}
                              checked={monitorForm.sectorIds.includes(sector.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMonitorForm({
                                    ...monitorForm,
                                    sectorIds: [...monitorForm.sectorIds, sector.id]
                                  })
                                } else {
                                  setMonitorForm({
                                    ...monitorForm,
                                    sectorIds: monitorForm.sectorIds.filter(id => id !== sector.id)
                                  })
                                }
                              }}
                            />
                            <label htmlFor={`sector-${sector.id}`} className="text-sm">
                              {sector.nombre}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={monitorForm.activo}
                        onCheckedChange={(checked) => setMonitorForm({ ...monitorForm, activo: checked })}
                      />
                      <Label>Activo</Label>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="submit">{editMonitor ? 'Actualizar' : 'Crear'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loadingMonitores ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {monitores.map((monitor) => (
                      <div key={monitor.id} className="flex flex-col gap-2 p-4 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{monitor.nombre}</div>
                            {monitor.descripcion && (
                              <div className="text-sm text-slate-600">{monitor.descripcion}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${monitor.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {monitor.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            <Button size="icon" variant="ghost" onClick={() => prepararEdicionMonitor(monitor)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => eliminarMonitor(monitor.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {monitor.sectores && monitor.sectores.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {monitor.sectores.map((ms: any) => (
                              <span
                                key={ms.sector.id}
                                className="px-2 py-1 rounded text-xs text-white"
                                style={{ backgroundColor: ms.sector.color }}
                              >
                                {ms.sector.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
