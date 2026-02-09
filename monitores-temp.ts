const monitoresCode = `
      {/* Tab Monitores */}
          <TabsContent value="monitores" className="mt-6">
            {loadingMonitores ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Header con botón de crear */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Gestión de Monitores</h2>
                  <Button onClick={() => {
                    setMonitorForm({ nombre: '', descripcion: '', sectorIds: [], activo: true })
                    setEditMonitor(null)
                    setMonitorDialogOpen(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Monitor
                  </Button>
                </div>

                {/* Dialog para crear/editar monitor */}
                <Dialog open={monitorDialogOpen} onOpenChange={(open) => {
                  if (!open) {
                    setMonitorDialogOpen(false)
                    setEditMonitor(null)
                    setMonitorForm({ nombre: '', descripcion: '', sectorIds: [], activo: true })
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setMonitorForm({ nombre: '', descripcion: '', sectorIds: [], activo: true })
                        setEditMonitor(null)
                        setMonitorDialogOpen(true)
                      }}
                      disabled={loadingMonitores}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Monitor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editMonitor ? 'Editar Monitor' : 'Nuevo Monitor'}</DialogTitle>
                    <form onSubmit={guardarMonitor} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Monitor</Label>
                        <Input
                          id="nombre"
                          value={monitorForm.nombre}
                          onChange={(e) => setMonitorForm({ ...monitorForm, nombre: e.target.value })}
                          placeholder="Ej: Monitor Principal, Sala 1"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción (opcional)</Label>
                        <textarea
                          id="descripcion"
                          value={monitorForm.descripcion}
                          onChange={(e) => setMonitorForm({ ...monitorForm, descripcion: e.target.value })}
                          placeholder="Descripción del monitor..."
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Seleccionar Sectores</Label>
                        <div className="grid md:grid-cols-3 gap-2">
                          {sectores.map((sector) => (
                            <div key={sector.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={sector.id}
                                checked={monitorForm.sectorIds.includes(sector.id)}
                                onCheckedChange={(checked) =>
                                  setMonitorForm({
                                    ...monitorForm,
                                    sectorIds: checked
                                      ? [...monitorForm.sectorIds, sector.id]
                                      : monitorForm.sectorIds.filter((id) => id !== sector.id)
                                  })
                                }
                              />
                              <span>{sector.nombre}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={monitorForm.activo}
                          onCheckedChange={(checked) =>
                            setMonitorForm({ ...monitorForm, activo: checked })
                          }
                        />
                        <Label>Activo</Label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="submit" disabled={loadingMonitores}>
                          {loadingMonitores ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {editMonitor ? 'Actualizar' : 'Crear'}
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMonitorDialogOpen(false)}
                          disabled={loadingMonitores}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Lista de monitores */}
                <div className="space-y-4">
                  {monitores.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center text-slate-500">
                        No hay monitores creados
                      </CardContent>
                    ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {monitores.map((monitor) => (
                        <Card key={monitor.id} className="relative group">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg font-medium truncate">{monitor.nombre}</CardTitle>
                                <Badge variant={monitor.activo ? 'default' : 'secondary'}>
                                  {monitor.activo ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => prepararEdicionMonitor(monitor)}
                                  className="h-8 w-8 hover:bg-slate-100"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => eliminarMonitor(monitor.id)}
                                  className="h-8 w-8 hover:bg-red-100 text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="text-sm text-slate-600">Descripción:</div>
                              <div className="font-medium">{monitor.descripcion || 'Sin descripción'}</div>
                              <div className="text-sm text-slate-600">
                                Sectores: {monitor.sectores?.map((ms: any) => ms.sector.nombre).join(', ') || 'Ninguno'}
                              </div>
                              <div className="text-sm text-slate-600">
                                Estado: {monitor.activo ? '✓ Activo' : '○ Inactivo'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
      `