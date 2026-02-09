'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Monitor, UserCheck, LayoutDashboard, Settings, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Configuracion {
  titulo: string
  subtitulo: string
  descripcion: string
}

export default function Home() {
  const [config, setConfig] = useState<Configuracion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/admin/configuracion')
        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        }
      } catch (error) {
        console.error('Error al cargar configuración:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    )
  }

  const titulo = config?.titulo || 'Sistema de Turnos'
  const subtitulo = config?.subtitulo || 'Plataforma de autogestión y atención'
  const descripcion = config?.descripcion || 'Seleccione la opción que corresponda según su rol en el sistema'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {titulo}
                </h1>
                <p className="text-sm text-slate-600">
                  {subtitulo}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Bienvenido al {titulo}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {descripcion}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tarjeta Tótem */}
            <Link href="/totem" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Tótem de Autogestión</CardTitle>
                  <CardDescription>
                    Para clientes que deseen sacar un turno
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Ingrese su DNI, seleccione el servicio y obtenga su número de espera automáticamente
                  </p>
                  <Button className="w-full group-hover:bg-green-600">
                    Acceder al Tótem
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Tarjeta Llamador */}
            <Link href="/llamador" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <LayoutDashboard className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Panel de Operador</CardTitle>
                  <CardDescription>
                    Para operadores que atienden clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Inicie sesión para gestionar la lista de espera, llamar clientes y registrar la atención
                  </p>
                  <Button className="w-full group-hover:bg-blue-600">
                    Acceder al Llamador
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Tarjeta Monitor */}
            <Link href="/monitor" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <Monitor className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Monitor de Turnos</CardTitle>
                  <CardDescription>
                    Pantalla de visualización en tiempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Visualice los turnos que están siendo atendidos y los clientes que están siendo llamados
                  </p>
                  <Button className="w-full group-hover:bg-purple-600">
                    Ver Monitor
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Tarjeta Configuraciones */}
            <Link href="/admin" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                    <Settings className="w-8 h-8 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl">Configuraciones</CardTitle>
                  <CardDescription>
                    Panel de administración del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Gestione usuarios, servicios y visualice estadísticas de atención
                  </p>
                  <Button className="w-full group-hover:bg-amber-600">
                    Acceder a Configuraciones
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Información adicional */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-primary mb-2">4</div>
              <p className="text-sm text-slate-600">Sectores de atención disponibles</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <p className="text-sm text-slate-600">Disponibilidad del sistema</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-600">
            Sistema de Gestión de Turnos © {new Date().getFullYear()} - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
