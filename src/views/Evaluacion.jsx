import { useState, useEffect } from 'react'
import { ClipboardCheck, Calendar, TrendingUp, MessageSquare } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { formatearMoneda, formatearPorcentaje, formatearFecha } from '../services/calculations'
import { db } from '../db/database'

export default function Evaluacion() {
  const { getResumenGlobal, isLoading } = usePortfolio()
  const [evaluaciones, setEvaluaciones] = useState([])
  const [notas, setNotas] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadEvaluaciones()
  }, [])

  const loadEvaluaciones = async () => {
    const evals = await db.evaluaciones.orderBy('fecha').reverse().toArray()
    setEvaluaciones(evals)
  }

  const resumen = getResumenGlobal()

  const handleSave = async () => {
    if (!resumen) return
    await db.evaluaciones.add({
      fecha: new Date().toISOString(),
      totalInvertido: resumen.totalInvertido,
      valorActual: resumen.valorActual,
      rentabilidad: resumen.rentabilidad,
      notas
    })
    setNotas('')
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    loadEvaluaciones()
  }

  if (isLoading) {
    return <div className="empty-state"><div className="empty-message">Cargando...</div></div>
  }

  return (
    <div className="animate-fade-in">
      {/* New Evaluation */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardCheck size={18} style={{ color: 'var(--accent-primary)' }} /> Nueva Evaluación
        </h3>

        {resumen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total invertido</span>
              <span style={{ fontWeight: 600 }}>{formatearMoneda(resumen.totalInvertido)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor actual</span>
              <span style={{ fontWeight: 600 }}>{formatearMoneda(resumen.valorActual)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rentabilidad</span>
              <span className={resumen.rentabilidad >= 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 700 }}>
                {formatearPorcentaje(resumen.rentabilidad)}
              </span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={14} /> Notas de evaluación
          </label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="¿Cómo ha ido este semestre? ¿Cambios de estrategia?"
            value={notas}
            onChange={e => setNotas(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSave} style={{ marginTop: '8px' }}>
          Guardar Snapshot
        </button>
        {saved && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center' }}>✓ Evaluación guardada</p>}
      </div>

      {/* Timeline */}
      <h3 className="section-title">Historial de Evaluaciones</h3>

      {evaluaciones.length === 0 ? (
        <div className="empty-state">
          <ClipboardCheck size={48} className="empty-icon" />
          <h3 className="empty-title">Sin evaluaciones</h3>
          <p className="empty-message">Guarda instantáneas periódicas de tu cartera para hacer seguimiento a largo plazo</p>
        </div>
      ) : (
        <div className="eval-timeline">
          {evaluaciones.map(ev => (
            <div key={ev.id} className="eval-item card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} /> {formatearFecha(ev.fecha)}
                </span>
                <span className={ev.rentabilidad >= 0 ? 'text-success' : 'text-danger'} style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} /> {formatearPorcentaje(ev.rentabilidad)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Inv: {formatearMoneda(ev.totalInvertido)}</span>
                <span>Val: {formatearMoneda(ev.valorActual)}</span>
              </div>
              {ev.notas && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  {ev.notas}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
