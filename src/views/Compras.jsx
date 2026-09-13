import { useState, useMemo } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { calcularCampoFaltante, formatearMoneda, formatearFecha } from '../services/calculations'

export default function Compras() {
  const { etfs, compras, agregarCompra, eliminarCompra, isLoading } = usePortfolio()
  const [showSheet, setShowSheet] = useState(false)
  const [filtro, setFiltro] = useState('all')
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    etfId: '',
    fecha: today,
    importe: '',
    participaciones: '',
    precioUnitario: '',
    comision: '',
    notas: ''
  })

  // Set default ETF when loaded
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
    setForm(prev => {
      const next = { ...prev, [field]: value }

      const imp = field === 'importe' ? value : next.importe
      const part = field === 'participaciones' ? value : next.participaciones
      const pre = field === 'precioUnitario' ? value : next.precioUnitario

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
    await agregarCompra({
      etfId: parseInt(form.etfId) || form.etfId,
      fecha: form.fecha,
      importe: form.importe,
      participaciones: form.participaciones,
      precioUnitario: form.precioUnitario,
      comision: form.comision || '0',
      notas: form.notas
    })
    setForm({ etfId: etfs?.[0]?.id || '', fecha: today, importe: '', participaciones: '', precioUnitario: '', comision: '', notas: '' })
    setShowSheet(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar esta compra?')) {
      eliminarCompra(id)
    }
  }

  if (isLoading) {
    return <div className="empty-state"><div className="empty-message">Cargando...</div></div>
  }

  return (
    <div className="animate-fade-in">
      {/* Filter tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${filtro === 'all' ? 'active' : ''}`} onClick={() => setFiltro('all')}>Todas</button>
        {etfs && etfs.map(etf => (
          <button key={etf.id} className={`filter-tab ${filtro === etf.ticker ? 'active' : ''}`} onClick={() => setFiltro(etf.ticker)}>
            {etf.ticker}
          </button>
        ))}
      </div>

      {/* Purchases list */}
      {comprasFiltradas.length === 0 ? (
        <div className="empty-state">
          <Plus size={48} className="empty-icon" />
          <h3 className="empty-title">Sin compras registradas</h3>
          <p className="empty-message">Pulsa el botón + para registrar tu primera compra de ETF</p>
        </div>
      ) : (
        <div className="list">
          {comprasFiltradas.map((compra, index) => {
            const etf = etfs?.find(e => e.id === compra.etfId)
            return (
              <div key={compra.id} className="list-item animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white', fontWeight: 600 }}>{etf?.ticker}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatearFecha(compra.fecha)}</span>
                  </div>
                  <div className="list-item-title" style={{ marginTop: '6px' }}>{formatearMoneda(compra.importe)}</div>
                  <div className="list-item-subtitle">
                    {parseFloat(compra.participaciones).toFixed(4)} part. × {formatearMoneda(compra.precioUnitario)}
                  </div>
                  {compra.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>{compra.notas}</div>}
                </div>
                <button className="btn btn-danger" style={{ padding: '8px', borderRadius: '10px' }} onClick={() => handleDelete(compra.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setShowSheet(true)}>
        <Plus size={24} />
      </button>

      {/* Bottom Sheet */}
      <div className={`sheet-overlay ${showSheet ? 'open' : ''}`} onClick={() => setShowSheet(false)}>
        <div className="sheet-content" onClick={e => e.stopPropagation()}>
          <div className="sheet-handle" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nueva Compra</h3>
            <button className="header-action" onClick={() => setShowSheet(false)}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">ETF</label>
              <select className="form-select" value={form.etfId} onChange={e => handleFieldChange('etfId', e.target.value)}>
                {etfs && etfs.map(etf => (
                  <option key={etf.id} value={etf.id}>{etf.ticker} — {etf.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-input" value={form.fecha} onChange={e => handleFieldChange('fecha', e.target.value)} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Importe (€)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.importe} onChange={e => handleFieldChange('importe', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Participaciones</label>
                <input type="number" step="0.0001" className="form-input" placeholder="0.0000" value={form.participaciones} onChange={e => handleFieldChange('participaciones', e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Precio unitario (€)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.precioUnitario} onChange={e => handleFieldChange('precioUnitario', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Comisión (€)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.comision} onChange={e => handleFieldChange('comision', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notas (opcional)</label>
              <input type="text" className="form-input" placeholder="Ej: Aportación mensual" value={form.notas} onChange={e => handleFieldChange('notas', e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '8px' }}>
              Guardar Compra
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
