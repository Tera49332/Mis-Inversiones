import { useState } from 'react'
import { RefreshCw, Download, Info, Trash2, Shield } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { exportarCSV } from '../services/calculations'

export default function Ajustes() {
  const { etfs, compras, actualizarValoracion, getResumenPorETF } = usePortfolio()

  const [precios, setPrecios] = useState({})
  const [saved, setSaved] = useState(false)

  const handlePrecioChange = (etfId, valor) => {
    setPrecios(prev => ({ ...prev, [etfId]: valor }))
  }

  const handleUpdateValuations = async () => {
    for (const etf of (etfs || [])) {
      if (precios[etf.id] && parseFloat(precios[etf.id]) > 0) {
        await actualizarValoracion(etf.id, parseFloat(precios[etf.id]))
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExportCSV = () => {
    exportarCSV(compras, etfs)
  }

  const handleClearData = () => {
    if (window.confirm('¿ESTÁS SEGURO? Esto borrará todas las compras y valoraciones de forma irreversible.')) {
      if (window.confirm('ÚLTIMA ADVERTENCIA: ¿Borrar todo?')) {
        indexedDB.deleteDatabase('MiInversionETF')
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
      }
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Valoración Actual */}
      <div className="settings-section">
        <h3 className="settings-title">
          <RefreshCw size={18} style={{ color: 'var(--accent-primary)' }} /> Valoración Actual
        </h3>
        <p className="settings-description">
          Actualiza el precio por participación para calcular el valor actual de tu cartera.
        </p>
        {etfs && etfs.map(etf => {
          const resumen = getResumenPorETF(etf.id)
          return (
            <div key={etf.id} className="settings-row">
              <div>
                <div className="settings-label">{etf.ticker}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Último: {resumen?.ultimaValoracion ? `€${resumen.ultimaValoracion}` : 'Sin datos'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>€</span>
                <input
                  type="number"
                  step="0.01"
                  className="settings-input"
                  placeholder="0.00"
                  value={precios[etf.id] || ''}
                  onChange={e => handlePrecioChange(etf.id, e.target.value)}
                />
              </div>
            </div>
          )
        })}
        <button className="btn btn-primary btn-full" onClick={handleUpdateValuations} style={{ marginTop: '16px' }}>
          <RefreshCw size={16} /> Actualizar Precios
        </button>
        {saved && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center' }}>✓ Valoraciones actualizadas</p>}
      </div>

      {/* Exportar Datos */}
      <div className="settings-section">
        <h3 className="settings-title">
          <Download size={18} style={{ color: 'var(--accent-primary)' }} /> Exportar Datos
        </h3>
        <p className="settings-description">
          Descarga un archivo CSV con todas tus compras para Excel o Google Sheets.
        </p>
        <button className="btn btn-secondary btn-full" onClick={handleExportCSV}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Acerca de */}
      <div className="settings-section">
        <h3 className="settings-title">
          <Info size={18} style={{ color: 'var(--accent-primary)' }} /> Acerca de
        </h3>
        <div className="settings-row">
          <span className="settings-label">Mi Inversión ETF</span>
          <span style={{ color: 'var(--text-tertiary)' }}>v1.0.0</span>
        </div>
      </div>

      {/* Zona Peligrosa */}
      <div className="settings-section danger-zone">
        <h3 className="settings-title" style={{ color: 'var(--danger)' }}>
          <Trash2 size={18} /> Zona Peligrosa
        </h3>
        <p className="settings-description">
          Borrar todos los datos de la aplicación. Esta acción es irreversible.
        </p>
        <button className="btn btn-danger btn-full" onClick={handleClearData}>
          <Trash2 size={16} /> Borrar Todos los Datos
        </button>
      </div>
    </div>
  )
}
