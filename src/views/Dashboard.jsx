import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Clock, AlertTriangle } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { formatearMoneda, formatearPorcentaje, formatearFecha } from '../services/calculations'

export default function Dashboard({ onNavigate }) {
  const { etfs, compras, getResumenGlobal, getResumenPorETF, getDatosGrafico, isLoading } = usePortfolio()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 20) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  if (isLoading) {
    return <div className="empty-state"><div className="empty-message">Cargando...</div></div>
  }

  const resumenGlobal = getResumenGlobal()
  const datosGrafico = getDatosGrafico()
  const isPositive = resumenGlobal && resumenGlobal.ganancia >= 0

  if (!compras || compras.length === 0) {
    return (
      <div className="animate-fade-in">
        <div style={{fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>{greeting}</div>
        <div className="empty-state">
          <PiggyBank size={56} className="empty-icon" />
          <h3 className="empty-title">Sin inversiones aún</h3>
          <p className="empty-message">Añade tu primera compra de ETF para empezar a hacer seguimiento</p>
          <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('compras')} style={{marginTop: '12px'}}>
            Añadir primera inversión
          </button>
        </div>
      </div>
    )
  }

  // Comprobar si hay valoraciones antiguas (más de 30 días)
  const hoy = new Date();
  let diasUltimaValoracion = 0;
  if (resumenGlobal?.fechaUltimaValoracion) {
    const fechaVal = new Date(resumenGlobal.fechaUltimaValoracion);
    diasUltimaValoracion = Math.floor((hoy - fechaVal) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="animate-fade-in">
      <div style={{fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem'}}>{greeting}</div>
      
      {resumenGlobal.valoracionesFaltantes || diasUltimaValoracion > 30 ? (
        <div className="card" style={{background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center'}}>
          <AlertTriangle size={24} style={{color: 'var(--warning)', flexShrink: 0}} />
          <div style={{fontSize: '0.875rem', color: 'var(--text-primary)'}}>
            Tienes compras registradas, pero {resumenGlobal.fechaUltimaValoracion ? `la última valoración es de hace ${diasUltimaValoracion} días.` : 'no tienes valoraciones registradas.'} Actualiza precios en Ajustes.
          </div>
        </div>
      ) : null}

      {/* Main value card */}
      <div className="card" style={{background: 'var(--accent-gradient)', border: 'none', marginBottom: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.85}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <Wallet size={16} />
            <span style={{fontSize: '0.875rem'}}>Valor de tu cartera</span>
          </div>
          {resumenGlobal.fechaUltimaValoracion && (
            <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem'}}>
              <Clock size={12} /> {formatearFecha(resumenGlobal.fechaUltimaValoracion.split('T')[0])}
            </div>
          )}
        </div>
        <div style={{fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em'}}>
          {formatearMoneda(resumenGlobal.valorActual)}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', background: isPositive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', fontSize: '0.875rem', fontWeight: 600}}>
            {isPositive ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
            {formatearMoneda(resumenGlobal.ganancia)}
          </span>
          <span style={{fontSize: '0.875rem', opacity: 0.85}}>
            {formatearPorcentaje(resumenGlobal.rentabilidad)}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-subtitle"><PiggyBank size={14}/> Invertido</div>
          <div className="stat-value" style={{fontSize: '1.25rem'}}>{formatearMoneda(resumenGlobal.totalInvertido)}</div>
        </div>
        <div className={`stat-card ${isPositive ? 'profit' : 'loss'}`}>
          <div className="stat-subtitle">{isPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} Ganancia</div>
          <div className={`stat-value ${isPositive ? 'text-success' : 'text-danger'}`} style={{fontSize: '1.25rem'}}>{formatearMoneda(resumenGlobal.ganancia)}</div>
        </div>
      </div>

      {/* ETF Breakdown */}
      <h3 className="section-title">Mis ETFs</h3>
      {etfs && etfs.map(etf => {
        const resumen = getResumenPorETF(etf.id)
        if (!resumen || resumen.totalInvertido === 0) return null
        const etfPositive = resumen.ganancia >= 0
        return (
          <div key={etf.id} className="card animate-slide-up" style={{marginBottom: '12px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span className="badge" style={{background: 'var(--accent-primary)', color: 'white', fontWeight: 600}}>{etf.ticker}</span>
                </div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px'}}>{etf.nombre}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontWeight: 700, fontSize: '1.1rem'}}>{formatearMoneda(resumen.valorActual)}</div>
                <div className={etfPositive ? 'text-success' : 'text-danger'} style={{fontSize: '0.8rem', fontWeight: 600}}>
                  {etfPositive ? '+' : ''}{formatearPorcentaje(resumen.rentabilidad)}
                </div>
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
              <span>Invertido: {formatearMoneda(resumen.totalInvertido)}</span>
              <span>{resumen.totalParticipaciones.toFixed(4)} part. | Medio: {formatearMoneda(resumen.precioMedio)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
