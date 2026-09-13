import { useState, useRef } from 'react'
import { RefreshCw, Download, Upload, Info, Trash2, Shield, AlertTriangle } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { exportarCSV, exportarBackupCompleto } from '../services/calculations'
import { db } from '../db/database'

export default function Ajustes() {
  const { etfs, compras, actualizarValoracion, getResumenPorETF } = usePortfolio()
  const fileInputRef = useRef(null)

  const [precios, setPrecios] = useState({})
  const [divisas, setDivisas] = useState({})
  const [tiposCambio, setTiposCambio] = useState({})
  const [saved, setSaved] = useState(false)
  const [pin, setPin] = useState('')
  const [pinMessage, setPinMessage] = useState('')

  const handlePrecioChange = (etfId, valor) => {
    setPrecios(prev => ({ ...prev, [etfId]: valor }))
  }

  const handleDivisaChange = (etfId, valor) => {
    setDivisas(prev => ({ ...prev, [etfId]: valor }))
  }

  const handleTipoCambioChange = (etfId, valor) => {
    setTiposCambio(prev => ({ ...prev, [etfId]: valor }))
  }

  const handleUpdateValuations = async () => {
    for (const etf of (etfs || [])) {
      if (precios[etf.id] && parseFloat(precios[etf.id]) > 0) {
        const divisa = divisas[etf.id] || etf.divisaCotizacion || 'EUR'
        const cambio = divisa === 'EUR' ? 1 : parseFloat(tiposCambio[etf.id] || 1)
        await actualizarValoracion(etf.id, parseFloat(precios[etf.id]), divisa, cambio, 'Manual')
      }
    }
    setPrecios({})
    setTiposCambio({})
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleExportCSV = () => {
    exportarCSV(compras, etfs)
  }

  const handleExportJSON = async () => {
    await exportarBackupCompleto(db)
  }

  const handleImportJSON = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (window.confirm('¿Importar copia de seguridad? Esto SOBREESCRIBIRÁ todos tus datos actuales.')) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const backup = JSON.parse(e.target.result)
          if (backup.datos && backup.datos.compras) {
            await db.transaction('rw', db.etfs, db.compras, db.valoraciones, db.evaluaciones, async () => {
              await db.etfs.clear()
              await db.compras.clear()
              await db.valoraciones.clear()
              await db.evaluaciones.clear()

              if (backup.datos.etfs.length > 0) await db.etfs.bulkAdd(backup.datos.etfs)
              if (backup.datos.compras.length > 0) await db.compras.bulkAdd(backup.datos.compras)
              if (backup.datos.valoraciones.length > 0) await db.valoraciones.bulkAdd(backup.datos.valoraciones)
              if (backup.datos.evaluaciones.length > 0) await db.evaluaciones.bulkAdd(backup.datos.evaluaciones)
            })
            alert('Copia de seguridad restaurada con éxito')
            window.location.reload()
          } else {
            alert('Formato de archivo incorrecto')
          }
        } catch (error) {
          alert('Error al leer el archivo: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
    e.target.value = null
  }

  const handleClearData = async () => {
    if (window.confirm('⚠️ ADVERTENCIA 1: Vas a borrar todos los datos (compras, gráficos, evaluaciones). Te recomendamos exportar una copia JSON antes. ¿Continuar?')) {
      if (window.confirm('🚨 ADVERTENCIA 2: Esta es la confirmación final. Los datos se borrarán para siempre. ¿Estás absolutamente seguro?')) {
        await db.compras.clear()
        await db.valoraciones.clear()
        await db.evaluaciones.clear()
        alert('Datos borrados. Se conservan los ETFs y la configuración del PIN.')
        window.location.reload()
      }
    }
  }

  const handleChangePin = (e) => {
    e.preventDefault()
    if (pin.length !== 4) {
      setPinMessage('El PIN debe tener 4 dígitos')
      return
    }
    localStorage.setItem('app_pin', btoa(pin))
    setPinMessage('PIN actualizado correctamente')
    setPin('')
    setTimeout(() => setPinMessage(''), 3000)
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Valoración Actual */}
      <div className="settings-section">
        <h3 className="settings-title">
          <RefreshCw size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" /> Actualizar Precios
        </h3>
        <p className="settings-description">
          Añade una nueva cotización histórica para proyectarla en los gráficos.
        </p>
        {etfs && etfs.map(etf => {
          const resumen = getResumenPorETF(etf.id)
          const divisaSeleccionada = divisas[etf.id] || etf.divisaCotizacion || 'EUR'
          return (
            <div key={etf.id} className="settings-row" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="settings-label">{etf.ticker}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Último: {resumen?.ultimaValoracion ? `${resumen.ultimaValoracion}` : 'Sin datos'}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor={`divisa-${etf.id}`} style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>Divisa</label>
                  <select id={`divisa-${etf.id}`} className="form-select" style={{padding: '8px'}} value={divisaSeleccionada} onChange={e => handleDivisaChange(etf.id, e.target.value)}>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`precio-${etf.id}`} style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>Precio ({divisaSeleccionada})</label>
                  <input
                    id={`precio-${etf.id}`}
                    type="text"
                    inputMode="decimal"
                    className="settings-input"
                    placeholder="0.00"
                    value={precios[etf.id] || ''}
                    onChange={e => handlePrecioChange(etf.id, e.target.value.replace(',', '.'))}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              {divisaSeleccionada !== 'EUR' && (
                <div>
                  <label htmlFor={`cambio-${etf.id}`} style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>Tipo de cambio a EUR</label>
                  <input
                    id={`cambio-${etf.id}`}
                    type="text"
                    inputMode="decimal"
                    className="settings-input"
                    placeholder="Ej: 0.91"
                    value={tiposCambio[etf.id] || ''}
                    onChange={e => handleTipoCambioChange(etf.id, e.target.value.replace(',', '.'))}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              )}
            </div>
          )
        })}
        <button className="btn btn-primary btn-full" onClick={handleUpdateValuations} style={{ marginTop: '16px' }}>
          Guardar Cotizaciones
        </button>
        {saved && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center' }} role="status">✓ Histórico guardado</p>}
      </div>

      {/* Seguridad */}
      <div className="settings-section">
        <h3 className="settings-title">
          <Shield size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" /> Seguridad
        </h3>
        <form onSubmit={handleChangePin}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="pin-input" className="form-label">Cambiar PIN de acceso</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                id="pin-input"
                type="password" 
                inputMode="numeric"
                maxLength="4"
                pattern="\d{4}"
                className="form-input"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Nuevo PIN (4 dígitos)"
              />
              <button type="submit" className="btn btn-secondary">
                Cambiar
              </button>
            </div>
          </div>
          {pinMessage && <p style={{marginTop: '8px', fontSize: '0.8rem', color: pinMessage.includes('correctamente') ? 'var(--success)' : 'var(--danger)'}} role="alert">{pinMessage}</p>}
        </form>
      </div>

      {/* Copias de seguridad */}
      <div className="settings-section">
        <h3 className="settings-title">
          <Download size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" /> Copias de Seguridad
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <button className="btn btn-secondary btn-full" onClick={handleExportCSV}>
            <Download size={16} aria-hidden="true" /> Exportar Compras (CSV)
          </button>
          <button className="btn btn-primary btn-full" onClick={handleExportJSON}>
            <Download size={16} aria-hidden="true" /> Exportar Backup Completo (JSON)
          </button>
          
          <div style={{ height: '1px', background: 'var(--border-glass)', margin: '8px 0' }} />
          
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImportJSON} 
            style={{ display: 'none' }} 
            aria-label="Seleccionar archivo JSON para importar"
          />
          <button className="btn btn-secondary btn-full" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Importar Backup (JSON)
          </button>
        </div>
      </div>

      {/* Zona Peligrosa */}
      <div className="settings-section danger-zone">
        <h3 className="settings-title" style={{ color: 'var(--danger)' }}>
          <Trash2 size={18} aria-hidden="true" /> Zona Peligrosa
        </h3>
        <p className="settings-description">
          Borrar todos los datos de compras, gráficos y evaluaciones de la aplicación.
        </p>
        <button className="btn btn-danger btn-full" onClick={handleClearData}>
          <AlertTriangle size={16} aria-hidden="true" /> Eliminar mi cartera
        </button>
      </div>
    </div>
  )
}
