import { useState, useMemo } from 'react'
import { Plus, X, Trash2, PiggyBank, AlertCircle, Info } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { calcularCampoFaltante, formatearMoneda, formatearFecha, validarCuadreConTolerancia } from '../services/calculations'

export default function Compras() {
  const { etfs, compras, agregarCompra, eliminarCompra, isLoading } = usePortfolio()
  const [showSheet, setShowSheet] = useState(false)
  const [filtro, setFiltro] = useState('all')
  const [errorCuadre, setErrorCuadre] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    etfId: '',
    fecha: today,
    divisa: 'EUR',
    tipoCambioAEUR: '1',
    importe: '',
    participaciones: '',
    precioUnitario: '',
    comision: '',
    notas: ''
  })

  useMemo(() => {
    if (etfs && etfs.length > 0 && !form.etfId) {
      setForm(f => ({ ...f, etfId: etfs[0].id }))
    }
  }, [etfs])

  const comprasFiltradas = useMemo(() => {
    if (!compras) return []
    if (filtro === 'all') return compras
    return compras.filter(c => {
      const etf = etfs?.find(e => e.id === c.etfId)
      return etf?.ticker === filtro
    })
  }, [compras, filtro, etfs])

  const handleFieldChange = (field, value) => {
    const safeValue = typeof value === 'string' && ['importe', 'participaciones', 'precioUnitario', 'comision', 'tipoCambioAEUR'].includes(field) 
      ? value.replace(',', '.') 
      : value;
    
    setForm(prev => {
      const next = { ...prev, [field]: safeValue }
      
      setErrorCuadre('')

      const imp = field === 'importe' ? safeValue : next.importe
      const part = field === 'participaciones' ? safeValue : next.participaciones
      const pre = field === 'precioUnitario' ? safeValue : next.precioUnitario

      if (field !== 'importe' && part && pre && parseFloat(part) && parseFloat(pre)) {
        const calc = calcularCampoFaltante('', part, pre)
        if (calc) next.importe = calc
      } else if (field !== 'participaciones' && imp && pre && parseFloat(imp) && parseFloat(pre)) {
        const calc = calcularCampoFaltante(imp, '', pre)
        if (calc) next.participaciones = calc
      } else if (field !== 'precioUnitario' && imp && part && parseFloat(imp) && parseFloat(part)) {
        const calc = calcularCampoFaltante(imp, part, '')
        if (calc) next.precioUnitario = calc
      }

      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (form.importe && form.participaciones && form.precioUnitario) {
      const esValido = validarCuadreConTolerancia(form.importe, form.participaciones, form.precioUnitario, form.comision);
      if (!esValido) {
        setErrorCuadre('Los datos no cuadran. Revisa el importe, las participaciones y el precio de ejecución.')
        return
      }
    }

    await agregarCompra({
      etfId: parseInt(form.etfId) || form.etfId,
      fecha: form.fecha,
      divisa: form.divisa,
      tipoCambioAEUR: form.divisa === 'EUR' ? '1' : form.tipoCambioAEUR,
      importe: form.importe,
      participaciones: form.participaciones,
      precioUnitario: form.precioUnitario,
      comision: form.comision || '0',
      notas: form.notas
    })
    
    setForm({ etfId: etfs?.[0]?.id || '', fecha: today, divisa: 'EUR', tipoCambioAEUR: '1', importe: '', participaciones: '', precioUnitario: '', comision: '', notas: '' })
    setErrorCuadre('')
    setShowSheet(false)
    alert('Compra registrada correctamente')
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar esta compra?')) {
      eliminarCompra(id)
    }
  }

  if (isLoading) {
    return <div className="empty-state" aria-live="polite"><div className="empty-message">Cargando...</div></div>
  }

  return (
    <div className="animate-fade-in">
      <div className="filter-tabs" role="tablist" aria-label="Filtrar por ETF">
        <button role="tab" aria-selected={filtro === 'all'} className={`filter-tab ${filtro === 'all' ? 'active' : ''}`} onClick={() => setFiltro('all')}>Todas</button>
        {etfs && etfs.map(etf => (
          <button key={etf.id} role="tab" aria-selected={filtro === etf.ticker} className={`filter-tab ${filtro === etf.ticker ? 'active' : ''}`} onClick={() => setFiltro(etf.ticker)}>
            {etf.ticker}
          </button>
        ))}
      </div>

      {comprasFiltradas.length === 0 ? (
        <div className="empty-state">
          <PiggyBank size={56} className="empty-icon" aria-hidden="true" />
          <h3 className="empty-title">Sin compras registradas</h3>
          <p className="empty-message">Introduce los datos del justificante de tu bróker (ej: Trade Republic)</p>
          <button className="btn btn-primary" onClick={() => setShowSheet(true)} style={{marginTop: '12px'}}>
            Añadir primera inversión
          </button>
        </div>
      ) : (
        <div className="list" role="list" aria-label="Lista de compras">
          {comprasFiltradas.map((compra, index) => {
            const etf = etfs?.find(e => e.id === compra.etfId)
            const isEur = compra.divisa === 'EUR' || !compra.divisa;
            return (
              <div key={compra.id} className="list-item animate-slide-up" role="listitem" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white', fontWeight: 600 }}>{etf?.ticker}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatearFecha(compra.fecha)}</span>
                  </div>
                  <div className="list-item-title" style={{ marginTop: '6px' }}>
                    {formatearMoneda(compra.importe, compra.divisa || 'EUR')}
                    {!isEur && <span style={{fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '6px'}}>({formatearMoneda(parseFloat(compra.importe) * parseFloat(compra.tipoCambioAEUR || 1), 'EUR')})</span>}
                  </div>
                  <div className="list-item-subtitle">
                    {parseFloat(compra.participaciones).toFixed(4)} part. × {formatearMoneda(compra.precioUnitario, compra.divisa || 'EUR')}
                  </div>
                  {compra.comision > 0 && <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Comisión: {formatearMoneda(compra.comision, compra.divisa || 'EUR')}</div>}
                  {compra.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>{compra.notas}</div>}
                </div>
                <button aria-label="Eliminar compra" className="btn btn-danger" style={{ padding: '8px', borderRadius: '10px' }} onClick={() => handleDelete(compra.id)}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {comprasFiltradas.length > 0 && (
        <button aria-label="Añadir nueva compra" className="fab" onClick={() => setShowSheet(true)}>
          <Plus size={24} aria-hidden="true" />
        </button>
      )}

      {/* Bottom Sheet Modal */}
      <div className={`sheet-overlay ${showSheet ? 'open' : ''}`} onClick={() => setShowSheet(false)} aria-hidden={!showSheet}>
        <div className="sheet-content" onClick={e => e.stopPropagation()} style={{maxHeight: '90vh', overflowY: 'auto'}} role="dialog" aria-labelledby="dialog-title">
          <div className="sheet-handle" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 id="dialog-title" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nueva Compra</h3>
            <button aria-label="Cerrar formulario" className="header-action" onClick={() => setShowSheet(false)}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          
          <div style={{background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', marginBottom: '16px'}}>
            <Info size={16} style={{color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px'}} aria-hidden="true"/>
            <p style={{fontSize: '0.8rem', color: 'var(--text-primary)'}}>Introduce los datos del justificante de Trade Republic. Usa punto o coma para los decimales.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="etf-select" className="form-label">ETF</label>
              <select id="etf-select" className="form-select" value={form.etfId} onChange={e => handleFieldChange('etfId', e.target.value)}>
                {etfs && etfs.map(etf => (
                  <option key={etf.id} value={etf.id}>{etf.ticker} — {etf.nombre} ({etf.isin || 'Sin ISIN'})</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha-input" className="form-label">Fecha</label>
                <input id="fecha-input" type="date" className="form-input" value={form.fecha} onChange={e => handleFieldChange('fecha', e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="divisa-select" className="form-label">Divisa de cotización</label>
                <select id="divisa-select" className="form-select" value={form.divisa} onChange={e => handleFieldChange('divisa', e.target.value)}>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {form.divisa !== 'EUR' && (
              <div className="form-group">
                <label htmlFor="cambio-input" className="form-label">Tipo de cambio a EUR aplicado</label>
                <input id="cambio-input" type="text" inputMode="decimal" className="form-input" placeholder="Ej: 0.91" value={form.tipoCambioAEUR} onChange={e => handleFieldChange('tipoCambioAEUR', e.target.value)} required />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="importe-input" className="form-label">Importe total ({form.divisa})</label>
                <input id="importe-input" type="text" inputMode="decimal" className="form-input" placeholder="0.00" value={form.importe} onChange={e => handleFieldChange('importe', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="part-input" className="form-label">Participaciones</label>
                <input id="part-input" type="text" inputMode="decimal" className="form-input" placeholder="0.0000" value={form.participaciones} onChange={e => handleFieldChange('participaciones', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="precio-input" className="form-label">Precio unitario ({form.divisa})</label>
                <input id="precio-input" type="text" inputMode="decimal" className="form-input" placeholder="0.00" value={form.precioUnitario} onChange={e => handleFieldChange('precioUnitario', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="comision-input" className="form-label">Comisión ({form.divisa})</label>
                <input id="comision-input" type="text" inputMode="decimal" className="form-input" placeholder="0.00" value={form.comision} onChange={e => handleFieldChange('comision', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notas-input" className="form-label">Notas (opcional)</label>
              <input id="notas-input" type="text" className="form-input" placeholder="Ej: Aportación mensual" value={form.notas} onChange={e => handleFieldChange('notas', e.target.value)} />
            </div>

            {errorCuadre && (
              <div style={{background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', marginTop: '8px'}} role="alert">
                <AlertCircle size={16} style={{color: 'var(--danger)', flexShrink: 0, marginTop: '2px'}} aria-hidden="true"/>
                <p style={{fontSize: '0.8rem', color: 'var(--danger)'}}>{errorCuadre}</p>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '16px' }}>
              Confirmar Registro
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
