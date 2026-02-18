'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, LogOut, Users, Bell, CheckCircle2, Clock, XCircle, Square } from 'lucide-react'
import { AlertCircle } from 'lucide-react'

interface OperadorSector {
  id: string
  sector: {
    id: string
    nombre: string
    color: string
  }
}

interface OperadorBox {
  id: string
  box: {
    id: string
    nombre: string
  }
}

interface Operador {
  id: string
  username: string
  nombre: string
  sectores: OperadorSector[]
  boxes?: OperadorBox[]
}

interface Turno {
  id: string
  numero: string
  dni: string
  estado: string
  createdAt: string
}

export default function LlamadorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [operador, setOperador] = useState<Operador | null>(null)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [turnoActual, setTurnoActual] = useState<Turno | null>(null)
  const [loadingTurnos, setLoadingTurnos] = useState(false)
  const [selectedBoxId, setSelectedBoxId] = useState<string>('')

  // Manejo de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error en el login')
      }

      setOperador(data)
      setIsAuthenticated(true)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Error en el login')
    } finally {
      setLoading(false)
    }
  }

  // Manejo de logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setOperador(null)
    setTurnos([])
    setTurnoActual(null)
    setUsername('')
    setPassword('')
    setSelectedBoxId('')
  }

  // Cargar turnos en espera
  const cargarTurnos = async () => {
    if (!operador || operador.sectores.length === 0) return

    setLoadingTurnos(true)
    try {
      // Cargar turnos de todos los sectores del operador
      const sectorIds = operador.sectores.map(os => os.sector.id)

      // Para cada sector, cargar sus turnos
      const promises = sectorIds.map(sectorId =>
        fetch(`/api/turnos/listar?sectorId=${sectorId}`)
      )

      const responses = await Promise.all(promises)
      const allTurnos = (await Promise.all(responses.map(res => res.json()))).flat()

      // Eliminar duplicados basándome en el ID del turno
      const turnosUnicos = Array.from(new Map(allTurnos.map(t => [t.id, t])).values())
      
      setTurnos(turnosUnicos)
    } catch (error) {
      console.error('Error al cargar turnos:', error)
    } finally {
      setLoadingTurnos(false)
    }
  }

  // Llamar turno
  const handleLlamar = async (turno: Turno) => {
    if (!operador) return

    // Si ya hay un turno activo, no permitir llamar otro
    if (turnoActual) {
      setError('Debe finalizar o marcar como ausente el turno actual antes de llamar otro')
      return
    }

    // Si el operador tiene boxes asignados, debe seleccionar uno
    if (operador.boxes && operador.boxes.length > 0 && !selectedBoxId) {
      setError('Debe seleccionar un box antes de llamar un turno')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/turnos/llamar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          turnoId: turno.id,
          operadorId: operador.id,
          boxId: selectedBoxId || null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al llamar turno')
        // Si el servidor indica que hay un turno activo, cargarlo
        if (data.turnoActivo) {
          setTurnoActual(data.turnoActivo)
        }
        return
      }

      setTurnoActual(turno)
      await cargarTurnos()
    } catch (error) {
      console.error('Error al llamar turno:', error)
      setError('Error al llamar turno')
    } finally {
      setLoading(false)
    }
  }

  // Actualizar estado del turno actual
  const handleActualizarEstado = async (estado: string) => {
    if (!turnoActual) return

    try {
      const response = await fetch('/api/turnos/actualizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          turnoId: turnoActual.id,
          estado
        }),
      })

      if (response.ok) {
        if (estado === 'finalizado' || estado === 'ausente') {
          setTurnoActual(null)
          setError('')
          await cargarTurnos()
        }
      }
    } catch (error) {
      console.error('Error al actualizar turno:', error)
    }
  }

  // Cargar turno activo del operador al autenticarse
  const cargarTurnoActivo = async () => {
    if (!operador) return

    try {
      const response = await fetch(`/api/turnos/activo?operadorId=${operador.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.turno) {
          setTurnoActual(data.turno)
        }
      }
    } catch (error) {
      console.error('Error al cargar turno activo:', error)
    }
  }

  // Cargar turnos cuando se autentica
  useEffect(() => {
    if (isAuthenticated && operador) {
      cargarTurnoActivo()
      cargarTurnos()

      // Recargar turnos cada 30 segundos
      const interval = setInterval(cargarTurnos, 30000)

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, operador])

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Panel de Operador</CardTitle>
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
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
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

  // Dashboard del Operador
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Panel de Operador
            </h1>
            <p className="text-slate-600 mt-1">
              {operador?.nombre}
              {operador?.sectores && operador.sectores.length > 0 && (
                <>
                  {' - '}
                  {operador.sectores.map((os, index) => (
                    <span key={os.sector.id}>
                      <span
                        className="inline-block px-2 py-1 rounded text-xs text-white mr-1"
                        style={{ backgroundColor: os.sector.color }}
                      >
                        {os.sector.nombre}
                      </span>
                    </span>
                  ))}
                </>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </header>

        {/* Selector de Box */}
        {operador?.boxes && operador.boxes.length > 0 && (
          <Card className="mb-6 border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Square className="w-6 h-6 text-primary" />
                <Label className="text-lg font-semibold">Seleccionar Box:</Label>
                <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Seleccione un box" />
                  </SelectTrigger>
                  <SelectContent>
                    {operador.boxes.map((ob) => (
                      <SelectItem key={ob.box.id} value={ob.box.id}>
                        {ob.box.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBoxId && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Activo: {operador.boxes.find(ob => ob.box.id === selectedBoxId)?.box.nombre}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensaje de error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lista de Turnos en Espera */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Turnos en Espera
                <span className="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                  {turnos.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {turnoActual && (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    Tiene un turno activo. Finalícelo antes de llamar otro.
                  </AlertDescription>
                </Alert>
              )}
              {loadingTurnos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : turnos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay turnos en espera</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {turnos
                    .filter((turno, index, arr) => 
                      arr.findIndex(t => t.id === turno.id) === index
                    )
                    .map((turno) => (
                    <div
                      key={turno.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-shadow ${turnoActual ? 'bg-slate-100 opacity-60' : 'bg-white hover:shadow-md'}`}
                    >
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {turno.numero}
                        </div>
                        <div className="text-sm text-slate-600">
                          DNI: {turno.dni}
                        </div>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => handleLlamar(turno)}
                        disabled={!!turnoActual || loading}
                        title={turnoActual ? 'Finalice el turno actual primero' : 'Llamar turno'}
                      >
                        <Bell className="w-4 w-4 mr-2" />
                        Llamar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Turno Actual */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Turno Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {turnoActual ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {turnoActual.numero}
                    </div>
                    <div className="text-lg text-slate-600">
                      DNI: {turnoActual.dni}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 font-semibold mb-3">
                      ¿Qué desea hacer?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => handleActualizarEstado('atendiendo')}
                        disabled={turnoActual.estado === 'atendiendo'}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Iniciar Atención
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleActualizarEstado('ausente')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Ausente
                      </Button>
                    </div>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleActualizarEstado('finalizado')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalizar Atención
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay turno en atención</p>
                  <p className="text-sm mt-2">
                    Seleccione un turno de la lista para comenzar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
