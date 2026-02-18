'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Plus, Edit2, Trash2, Copy, RotateCcw, Download, Upload, Ticket } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Tipo para la configuración del ticket
interface TicketConfigType {
  papel: {
    ancho: number
    alto: number
    margen: number
  }
  logo: {
    visible: boolean
    url: string  // Puede ser URL externa o base64
    ancho: number
    alto: number
    posicion: string
    margenInferior: number
  }
  tituloSector: {
    visible: boolean
    tamaño: number
    negrita: boolean
    posicion: string
    bordeInferior: boolean
    margenInferior: number
  }
  numeroTurno: {
    tamaño: number
    negrita: boolean
    colorFondo: string
    colorTexto: string
    borderRadius: number
    paddingX: number
    paddingY: number
    margenSuperior: number
    margenInferior: number
  }
  info: {
    visible: boolean
    dni: {
      visible: boolean
      etiqueta: string
      tamaño: number
    }
    fecha: {
      visible: boolean
      etiqueta: string
      formato: string
      tamaño: number
    }
    hora: {
      visible: boolean
      etiqueta: string
      formato: string
      tamaño: number
    }
    alineacion: string
    margenSuperior: number
    interlineado: number
  }
  separador: {
    visible: boolean
    estilo: string
    grosor: number
    margenSuperior: number
    margenInferior: number
  }
  footer: {
    visible: boolean
    lineas: string[]
    tamaño: number
    alineacion: string
    margenSuperior: number
  }
  orden: string[]
}

interface SavedConfig {
  id: string
  nombre: string
  descripcion?: string
  esDefault: boolean
  config: string
  createdAt: string
}

// Configuración por defecto
const DEFAULT_CONFIG: TicketConfigType = {
  papel: { ancho: 80, alto: 90, margen: 10 },
  logo: { visible: true, url: '', ancho: 100, alto: 60, posicion: 'centro', margenInferior: 15 },
  tituloSector: { visible: true, tamaño: 22, negrita: true, posicion: 'centro', bordeInferior: true, margenInferior: 10 },
  numeroTurno: { tamaño: 60, negrita: true, colorFondo: '#000000', colorTexto: '#ffffff', borderRadius: 15, paddingX: 20, paddingY: 20, margenSuperior: 15, margenInferior: 15 },
  info: {
    visible: true,
    dni: { visible: true, etiqueta: 'DNI:', tamaño: 14 },
    fecha: { visible: true, etiqueta: 'Fecha:', formato: 'dd/mm/yyyy', tamaño: 14 },
    hora: { visible: true, etiqueta: 'Hora:', formato: '24h', tamaño: 14 },
    alineacion: 'centro',
    margenSuperior: 15,
    interlineado: 1.8
  },
  separador: { visible: true, estilo: 'dashed', grosor: 2, margenSuperior: 15, margenInferior: 15 },
  footer: { visible: true, lineas: ['Espere en la sala a ser llamado', '¡Gracias por su paciencia!'], tamaño: 11, alineacion: 'centro', margenSuperior: 15 },
  orden: ['logo', 'tituloSector', 'numeroTurno', 'separador-1', 'info', 'separador-2', 'footer']
}

// Componente para elementos ordenables
function SortableItem({ id, label, visible, onToggleVisible }: { id: string; label: string; visible?: boolean; onToggleVisible?: (visible: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-3 p-3 bg-white border rounded-lg mb-2 cursor-move hover:bg-slate-50">
      <div {...listeners} className="flex-1 font-medium">
        {label}
      </div>
      {onToggleVisible !== undefined && (
        <Switch checked={visible} onCheckedChange={onToggleVisible} />
      )}
    </div>
  )
}

export default function TicketEditor() {
  const { toast } = useToast()
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([])
  const [currentConfig, setCurrentConfig] = useState<TicketConfigType>(DEFAULT_CONFIG)
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newConfigName, setNewConfigName] = useState('')
  const [newConfigDesc, setNewConfigDesc] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Cargar configuraciones guardadas
  const loadConfigs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/tickets')
      const data = await response.json()
      setSavedConfigs(data)
      
      // Seleccionar la configuración default
      const defaultConfig = data.find((c: SavedConfig) => c.esDefault)
      if (defaultConfig) {
        setSelectedConfigId(defaultConfig.id)
        setCurrentConfig(JSON.parse(defaultConfig.config))
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error)
      toast({ title: 'Error', description: 'No se pudieron cargar las configuraciones', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  // Guardar configuración actual
  const saveConfig = async () => {
    if (!selectedConfigId) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/tickets/${selectedConfigId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: currentConfig })
      })
      if (response.ok) {
        toast({ title: '¡Éxito!', description: 'Configuración guardada' })
        loadConfigs()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Crear nueva configuración
  const createConfig = async () => {
    if (!newConfigName) return
    setSaving(true)
    try {
      const response = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newConfigName,
          descripcion: newConfigDesc,
          config: currentConfig
        })
      })
      if (response.ok) {
        toast({ title: '¡Éxito!', description: 'Nueva configuración creada' })
        setDialogOpen(false)
        setNewConfigName('')
        setNewConfigDesc('')
        loadConfigs()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Cargar una configuración específica
  const loadConfig = async (id: string) => {
    const config = savedConfigs.find(c => c.id === id)
    if (config) {
      setSelectedConfigId(id)
      setCurrentConfig(JSON.parse(config.config))
    }
  }

  // Eliminar configuración
  const deleteConfig = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta configuración?')) return
    try {
      const response = await fetch(`/api/admin/tickets/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: '¡Éxito!', description: 'Configuración eliminada' })
        loadConfigs()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  // Establecer como default
  const setAsDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ esDefault: true })
      })
      if (response.ok) {
        toast({ title: '¡Éxito!', description: 'Configuración establecida como predeterminada' })
        loadConfigs()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo establecer como default', variant: 'destructive' })
    }
  }

  // Restaurar a valores por defecto
  const resetToDefault = () => {
    if (confirm('¿Restaurar a la configuración por defecto? Se perderán los cambios no guardados.')) {
      setCurrentConfig(DEFAULT_CONFIG)
    }
  }

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = currentConfig.orden.indexOf(active.id as string)
      const newIndex = currentConfig.orden.indexOf(over.id as string)
      setCurrentConfig({
        ...currentConfig,
        orden: arrayMove(currentConfig.orden, oldIndex, newIndex)
      })
    }
  }

  // Actualizar configuración anidada
  const updateConfig = useCallback((path: string, value: any) => {
    setCurrentConfig(prev => {
      const newConfig = { ...prev }
      const keys = path.split('.')
      let current: any = newConfig
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newConfig
    })
  }, [])

  // Datos de ejemplo para la vista previa
  const previewData = {
    sector: 'Farmacia',
    numero: 'A001',
    dni: '12.345.678',
    fecha: new Date().toLocaleDateString('es-AR'),
    hora: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  // Convertir alineación español a CSS
  const getTextAlign = (alineacion: string): 'left' | 'center' | 'right' => {
    switch (alineacion) {
      case 'izquierda': return 'left'
      case 'centro': return 'center'
      case 'derecha': return 'right'
      default: return 'center'
    }
  }

  // Manejar upload de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'El archivo es muy grande. Máximo 2MB.', variant: 'destructive' })
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Solo se permiten archivos de imagen.', variant: 'destructive' })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      updateConfig('logo.url', base64)
      toast({ title: '¡Éxito!', description: 'Logo cargado correctamente' })
    }
    reader.onerror = () => {
      toast({ title: 'Error', description: 'No se pudo leer el archivo', variant: 'destructive' })
    }
    reader.readAsDataURL(file)
  }

  // Renderizar vista previa del ticket
  const renderPreview = () => {
    const { papel, logo, tituloSector, numeroTurno, info, separador, footer, orden } = currentConfig
    
    const getBorderStyle = (estilo: string) => {
      switch (estilo) {
        case 'dashed': return 'dashed'
        case 'dotted': return 'dotted'
        default: return 'solid'
      }
    }

    return (
      <div 
        className="bg-white shadow-lg mx-auto overflow-hidden"
        style={{
          width: `${papel.ancho * 3}px`, // Escala para visualización
          padding: `${papel.margen}px`,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px'
        }}
      >
        {orden.map((elemento, index) => {
          switch (elemento) {
            case 'logo':
              return logo.visible && (
                <div key={index} style={{ textAlign: getTextAlign(logo.posicion), marginBottom: logo.margenInferior }}>
                  {logo.url ? (
                    <img 
                      src={logo.url} 
                      alt="Logo" 
                      style={{ 
                        maxWidth: logo.ancho, 
                        maxHeight: logo.alto,
                        margin: logo.posicion === 'centro' ? '0 auto' : logo.posicion === 'derecha' ? '0 0 0 auto' : undefined,
                        display: logo.posicion === 'centro' || logo.posicion === 'derecha' ? 'block' : 'inline'
                      }} 
                    />
                  ) : (
                    <div className="bg-slate-200 flex items-center justify-center text-slate-500 text-xs"
                      style={{ 
                        width: logo.ancho, 
                        height: logo.alto, 
                        margin: logo.posicion === 'centro' ? '0 auto' : logo.posicion === 'derecha' ? '0 0 0 auto' : undefined 
                      }}>
                      Logo
                    </div>
                  )}
                </div>
              )
            case 'tituloSector':
              return tituloSector.visible && (
                <div key={index} style={{ textAlign: getTextAlign(tituloSector.posicion), marginBottom: tituloSector.margenInferior, borderBottom: tituloSector.bordeInferior ? '2px solid #000' : 'none', paddingBottom: tituloSector.bordeInferior ? 10 : 0 }}>
                  <div style={{ fontSize: tituloSector.tamaño, fontWeight: tituloSector.negrita ? 'bold' : 'normal' }}>
                    {previewData.sector}
                  </div>
                </div>
              )
            case 'numeroTurno':
              return (
                <div key={index} style={{ textAlign: 'center', marginTop: numeroTurno.margenSuperior, marginBottom: numeroTurno.margenInferior }}>
                  <div style={{
                    display: 'inline-block',
                    padding: `${numeroTurno.paddingY}px ${numeroTurno.paddingX}px`,
                    borderRadius: numeroTurno.borderRadius,
                    backgroundColor: numeroTurno.colorFondo,
                    color: numeroTurno.colorTexto
                  }}>
                    <span style={{ fontSize: numeroTurno.tamaño, fontWeight: numeroTurno.negrita ? 'bold' : 'normal' }}>
                      {previewData.numero}
                    </span>
                  </div>
                </div>
              )
            case 'separador':
            case 'separador-1':
            case 'separador-2':
              return separador.visible && (
                <div key={index} style={{
                  borderTop: `${separador.grosor}px ${getBorderStyle(separador.estilo)} #000`,
                  marginTop: separador.margenSuperior,
                  marginBottom: separador.margenInferior
                }} />
              )
            case 'info':
              return info.visible && (
                <div key={index} style={{ textAlign: getTextAlign(info.alineacion), marginTop: info.margenSuperior, lineHeight: info.interlineado }}>
                  {info.dni.visible && (
                    <div style={{ fontSize: info.dni.tamaño }}><strong>{info.dni.etiqueta}</strong> {previewData.dni}</div>
                  )}
                  {info.fecha.visible && (
                    <div style={{ fontSize: info.fecha.tamaño }}><strong>{info.fecha.etiqueta}</strong> {previewData.fecha}</div>
                  )}
                  {info.hora.visible && (
                    <div style={{ fontSize: info.hora.tamaño }}><strong>{info.hora.etiqueta}</strong> {previewData.hora}</div>
                  )}
                </div>
              )
            case 'footer':
              return footer.visible && (
                <div key={index} style={{ textAlign: getTextAlign(footer.alineacion), fontSize: footer.tamaño, marginTop: footer.margenSuperior }}>
                  {footer.lineas.map((linea, i) => (
                    <p key={i}>{linea}</p>
                  ))}
                </div>
              )
            default:
              return null
          }
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de configuraciones */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedConfigId || ''} onValueChange={loadConfig}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar configuración" />
          </SelectTrigger>
          <SelectContent>
            {savedConfigs.map(config => (
              <SelectItem key={config.id} value={config.id}>
                {config.nombre} {config.esDefault ? '(Default)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Configuración
        </Button>
        
        <Button variant="outline" onClick={saveConfig} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Guardar Cambios
        </Button>
        
        <Button variant="outline" onClick={resetToDefault}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar
        </Button>
        
        {selectedConfigId && !savedConfigs.find(c => c.id === selectedConfigId)?.esDefault && (
          <Button variant="secondary" onClick={() => setAsDefault(selectedConfigId)}>
            Establecer como Default
          </Button>
        )}
        
        {selectedConfigId && !savedConfigs.find(c => c.id === selectedConfigId)?.esDefault && (
          <Button variant="destructive" size="icon" onClick={() => deleteConfig(selectedConfigId)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Panel de configuración */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="papel">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="papel">Papel</TabsTrigger>
                <TabsTrigger value="elementos">Elementos</TabsTrigger>
                <TabsTrigger value="turno">Turno</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
              </TabsList>

              {/* Tab Papel */}
              <TabsContent value="papel" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Ancho (mm)</Label>
                    <Input type="number" value={currentConfig.papel.ancho} onChange={e => updateConfig('papel.ancho', parseInt(e.target.value) || 80)} />
                  </div>
                  <div>
                    <Label>Alto (mm)</Label>
                    <Input type="number" value={currentConfig.papel.alto} onChange={e => updateConfig('papel.alto', parseInt(e.target.value) || 90)} />
                  </div>
                  <div>
                    <Label>Margen (px)</Label>
                    <Input type="number" value={currentConfig.papel.margen} onChange={e => updateConfig('papel.margen', parseInt(e.target.value) || 10)} />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Logo</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={currentConfig.logo.visible} onCheckedChange={v => updateConfig('logo.visible', v)} />
                      <Label>Mostrar logo</Label>
                    </div>
                    {currentConfig.logo.visible && (
                      <>
                        {/* Upload de archivo */}
                        <div>
                          <Label>Subir Logo</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="file" 
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="cursor-pointer"
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Formatos: PNG, JPG, GIF. Máximo 2MB</p>
                        </div>
                        
                        {/* Preview del logo actual */}
                        {currentConfig.logo.url && (
                          <div className="border rounded-lg p-3 bg-slate-50">
                            <div className="flex items-center gap-3">
                              <img 
                                src={currentConfig.logo.url} 
                                alt="Logo actual" 
                                className="max-w-[80px] max-h-[50px] object-contain border rounded bg-white p-1"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Logo cargado</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-destructive h-auto p-1"
                                  onClick={() => updateConfig('logo.url', '')}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Opción para URL externa */}
                        <div>
                          <Label className="text-slate-500">O usar URL externa (opcional)</Label>
                          <Input 
                            value={currentConfig.logo.url && !currentConfig.logo.url.startsWith('data:') ? currentConfig.logo.url : ''} 
                            onChange={e => updateConfig('logo.url', e.target.value)} 
                            placeholder="https://..." 
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Ancho (px)</Label>
                            <Input type="number" value={currentConfig.logo.ancho} onChange={e => updateConfig('logo.ancho', parseInt(e.target.value) || 100)} />
                          </div>
                          <div>
                            <Label>Alto (px)</Label>
                            <Input type="number" value={currentConfig.logo.alto} onChange={e => updateConfig('logo.alto', parseInt(e.target.value) || 60)} />
                          </div>
                        </div>
                        <div>
                          <Label>Posición</Label>
                          <Select value={currentConfig.logo.posicion} onValueChange={v => updateConfig('logo.posicion', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="izquierda">Izquierda</SelectItem>
                              <SelectItem value="centro">Centro</SelectItem>
                              <SelectItem value="derecha">Derecha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab Orden de Elementos */}
              <TabsContent value="elementos" className="space-y-4 mt-4">
                <p className="text-sm text-slate-600 mb-4">Arrastra para reordenar los elementos del ticket:</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={currentConfig.orden} strategy={verticalListSortingStrategy}>
                    {currentConfig.orden.map((elemento) => {
                      const getElementLabel = (el: string) => {
                        if (el.startsWith('separador')) return '➖ Separador'
                        const labels: Record<string, string> = {
                          logo: '🖼️ Logo',
                          tituloSector: '📋 Título del Sector',
                          numeroTurno: '🔢 Número de Turno',
                          info: 'ℹ️ Información (DNI, Fecha, Hora)',
                          footer: '📝 Pie de página'
                        }
                        return labels[el] || el
                      }
                      return <SortableItem key={elemento} id={elemento} label={getElementLabel(elemento)} />
                    })}
                  </SortableContext>
                </DndContext>
              </TabsContent>

              {/* Tab Número de Turno */}
              <TabsContent value="turno" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tamaño de texto</Label>
                    <Input type="number" value={currentConfig.numeroTurno.tamaño} onChange={e => updateConfig('numeroTurno.tamaño', parseInt(e.target.value) || 60)} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={currentConfig.numeroTurno.negrita} onCheckedChange={v => updateConfig('numeroTurno.negrita', v)} />
                    <Label>Negrita</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Color de fondo</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={currentConfig.numeroTurno.colorFondo} onChange={e => updateConfig('numeroTurno.colorFondo', e.target.value)} className="w-16 h-10" />
                      <Input value={currentConfig.numeroTurno.colorFondo} onChange={e => updateConfig('numeroTurno.colorFondo', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Color de texto</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={currentConfig.numeroTurno.colorTexto} onChange={e => updateConfig('numeroTurno.colorTexto', e.target.value)} className="w-16 h-10" />
                      <Input value={currentConfig.numeroTurno.colorTexto} onChange={e => updateConfig('numeroTurno.colorTexto', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Border Radius (px)</Label>
                    <Input type="number" value={currentConfig.numeroTurno.borderRadius} onChange={e => updateConfig('numeroTurno.borderRadius', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <Label>Padding horizontal (px)</Label>
                    <Input type="number" value={currentConfig.numeroTurno.paddingX} onChange={e => updateConfig('numeroTurno.paddingX', parseInt(e.target.value) || 20)} />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Título del Sector</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={currentConfig.tituloSector.visible} onCheckedChange={v => updateConfig('tituloSector.visible', v)} />
                      <Label>Mostrar título</Label>
                    </div>
                    {currentConfig.tituloSector.visible && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tamaño</Label>
                          <Input type="number" value={currentConfig.tituloSector.tamaño} onChange={e => updateConfig('tituloSector.tamaño', parseInt(e.target.value) || 22)} />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <Switch checked={currentConfig.tituloSector.negrita} onCheckedChange={v => updateConfig('tituloSector.negrita', v)} />
                          <Label>Negrita</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={currentConfig.tituloSector.bordeInferior} onCheckedChange={v => updateConfig('tituloSector.bordeInferior', v)} />
                          <Label>Línea inferior</Label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab Info */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Switch checked={currentConfig.info.visible} onCheckedChange={v => updateConfig('info.visible', v)} />
                  <Label>Mostrar información</Label>
                </div>
                
                {currentConfig.info.visible && (
                  <>
                    <div className="space-y-4 border p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Switch checked={currentConfig.info.dni.visible} onCheckedChange={v => updateConfig('info.dni.visible', v)} />
                        <Label>Mostrar DNI</Label>
                      </div>
                      {currentConfig.info.dni.visible && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <Label>Etiqueta</Label>
                            <Input value={currentConfig.info.dni.etiqueta} onChange={e => updateConfig('info.dni.etiqueta', e.target.value)} />
                          </div>
                          <div>
                            <Label>Tamaño</Label>
                            <Input type="number" value={currentConfig.info.dni.tamaño} onChange={e => updateConfig('info.dni.tamaño', parseInt(e.target.value) || 14)} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 border p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Switch checked={currentConfig.info.fecha.visible} onCheckedChange={v => updateConfig('info.fecha.visible', v)} />
                        <Label>Mostrar Fecha</Label>
                      </div>
                      {currentConfig.info.fecha.visible && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <Label>Etiqueta</Label>
                            <Input value={currentConfig.info.fecha.etiqueta} onChange={e => updateConfig('info.fecha.etiqueta', e.target.value)} />
                          </div>
                          <div>
                            <Label>Formato</Label>
                            <Select value={currentConfig.info.fecha.formato} onValueChange={v => updateConfig('info.fecha.formato', v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 border p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Switch checked={currentConfig.info.hora.visible} onCheckedChange={v => updateConfig('info.hora.visible', v)} />
                        <Label>Mostrar Hora</Label>
                      </div>
                      {currentConfig.info.hora.visible && (
                        <div className="grid grid-cols-2 gap-4 ml-6">
                          <div>
                            <Label>Etiqueta</Label>
                            <Input value={currentConfig.info.hora.etiqueta} onChange={e => updateConfig('info.hora.etiqueta', e.target.value)} />
                          </div>
                          <div>
                            <Label>Formato</Label>
                            <Select value={currentConfig.info.hora.formato} onValueChange={v => updateConfig('info.hora.formato', v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="24h">24 horas</SelectItem>
                                <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Alineación</Label>
                        <Select value={currentConfig.info.alineacion} onValueChange={v => updateConfig('info.alineacion', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="izquierda">Izquierda</SelectItem>
                            <SelectItem value="centro">Centro</SelectItem>
                            <SelectItem value="derecha">Derecha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Interlineado</Label>
                        <Input type="number" step="0.1" value={currentConfig.info.interlineado} onChange={e => updateConfig('info.interlineado', parseFloat(e.target.value) || 1.8)} />
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3">Separador</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={currentConfig.separador.visible} onCheckedChange={v => updateConfig('separador.visible', v)} />
                      <Label>Mostrar separador</Label>
                    </div>
                    {currentConfig.separador.visible && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Estilo</Label>
                          <Select value={currentConfig.separador.estilo} onValueChange={v => updateConfig('separador.estilo', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">Sólido</SelectItem>
                              <SelectItem value="dashed">Guiones</SelectItem>
                              <SelectItem value="dotted">Puntos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Grosor (px)</Label>
                          <Input type="number" value={currentConfig.separador.grosor} onChange={e => updateConfig('separador.grosor', parseInt(e.target.value) || 2)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab Footer */}
              <TabsContent value="footer" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Switch checked={currentConfig.footer.visible} onCheckedChange={v => updateConfig('footer.visible', v)} />
                  <Label>Mostrar pie de página</Label>
                </div>
                
                {currentConfig.footer.visible && (
                  <>
                    <div>
                      <Label>Líneas de texto</Label>
                      <div className="space-y-2">
                        {currentConfig.footer.lineas.map((linea, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={linea}
                              onChange={e => {
                                const newLineas = [...currentConfig.footer.lineas]
                                newLineas[index] = e.target.value
                                updateConfig('footer.lineas', newLineas)
                              }}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                const newLineas = currentConfig.footer.lineas.filter((_, i) => i !== index)
                                updateConfig('footer.lineas', newLineas)
                              }}
                              disabled={currentConfig.footer.lineas.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateConfig('footer.lineas', [...currentConfig.footer.lineas, ''])}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar línea
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tamaño de texto</Label>
                        <Input type="number" value={currentConfig.footer.tamaño} onChange={e => updateConfig('footer.tamaño', parseInt(e.target.value) || 11)} />
                      </div>
                      <div>
                        <Label>Alineación</Label>
                        <Select value={currentConfig.footer.alineacion} onValueChange={v => updateConfig('footer.alineacion', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="izquierda">Izquierda</SelectItem>
                            <SelectItem value="centro">Centro</SelectItem>
                            <SelectItem value="derecha">Derecha</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Vista previa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-slate-100 p-8 flex justify-center overflow-auto">
            {renderPreview()}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para nueva configuración */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Configuración de Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={newConfigName} onChange={e => setNewConfigName(e.target.value)} placeholder="Ej: Ticket Estrecho" />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input value={newConfigDesc} onChange={e => setNewConfigDesc(e.target.value)} placeholder="Descripción de la configuración" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={createConfig} disabled={!newConfigName || saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
