import { useState, useEffect } from 'react'
import { ClipboardCheck, Calendar, TrendingUp, MessageSquare, Clock } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { formatearMoneda, formatearPorcentaje, formatearFecha } from '../services/calculations'
import { db } from '../db/database'

export default function Evaluacion() {
  const { getResumenGlobal, isLoading } = usePortfolio()
  const [evaluaciones, setEvaluaciones] = useState([])
  const [notas, setNotas] = useState('')
  const [periodo, setPeriodo] = useState('Seis meses')
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
      periodo: periodo,
      totalInvertido: resumen.totalInvertido,
      valorActual: resumen.tieneAlgunaValoracion ? resumen.valorActual : null,
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

  const labelPregunta = periodo === 'Inicial' ? '¿Qué esperas de esta cartera a futuro?' :
                        periodo === 'Mensual' ? '¿Cómo ha ido este mes?' :
                        periodo === 'Seis meses' ? '¿Cómo ha ido este periodo de seis meses?' : 
                        '¿Cómo ha ido este año?';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* New Evaluation */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardCheck size={18} style={{ color: 'var(--accent-primary)' }} /> Nueva Evaluación
        </h3>

        {resumen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total invertido</span>
              <span style={{ fontWeight: 600 }}>{formatearMoneda(resumen.totalInvertido)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor actual</span>
              <span style={{ fontWeight: 600 }}>{resumen.tieneAlgunaValoracion ? formatearMoneda(resumen.valorActual) : 'Pendiente'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Rentabilidad</span>
              <span className={resumen.rentabilidad === null ? 'text-secondary' : (resumen.rentabilidad >= 0 ? 'text-success' : 'text-danger')} style={{ fontWeight: 700 }}>
                {resumen.rentabilidad !== null ? formatearPorcentaje(resumen.rentabilidad) : '---'}
              </span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Tipo de evaluación</label>
          <select className="form-select" value={periodo} onChange={e => setPeriodo(e.target.value)}>
            <option value="Inicial">Inicial (antes de primera compra)</option>
            <option value="Mensual">Mensual (opcional)</option>
            <option value="Seis meses">Seis meses</option>
            <option value="Anual">Anual</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={14} /> {labelPregunta}
          </label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="¿Te sientes cómodo con la volatilidad? ¿Has aprendido algo nuevo?"
            value={notas}
            onChange={e => setNotas(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSave} style={{ marginTop: '8px' }}>
          Guardar Snapshot Congelado
        </button>
        {saved && <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center' }}>✓ Evaluación guardada correctamente</p>}
      </div>

      {/* Timeline */}
      <h3 className="section-title">Revisión del plan (Histórico)</h3>

      {evaluaciones.length === 0 ? (
        <div className="empty-state">
          <ClipboardCheck size={48} className="empty-icon" />
          <h3 className="empty-title">Sin evaluaciones</h3>
          <p className="empty-message">Guarda instantáneas periódicas de tu cartera para hacer seguimiento a largo plazo de tus emociones y estrategia</p>
        </div>
      ) : (
        <div className="eval-timeline">
          {evaluaciones.map(ev => (
            <div key={ev.id} className="eval-item card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} /> {formatearFecha(ev.fecha)}
                </span>
                <span className="badge" style={{ background: 'var(--bg-tertiary)' }}>
                  {ev.periodo || 'Seis meses'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Capital aportado</span>
                <span style={{ fontWeight: 500 }}>{formatearMoneda(ev.totalInvertido)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Valor congelado</span>
                <span style={{ fontWeight: 500 }}>{ev.valorActual !== null ? formatearMoneda(ev.valorActual) : 'Sin datos'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Rentabilidad</span>
                <span className={ev.rentabilidad === null ? 'text-secondary' : (ev.rentabilidad >= 0 ? 'text-success' : 'text-danger')} style={{ fontWeight: 600 }}>
                  {ev.rentabilidad !== null ? formatearPorcentaje(ev.rentabilidad) : 'N/A'}
                </span>
              </div>
              {ev.notas && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  "{ev.notas}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
