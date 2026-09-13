import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { formatearMoneda, formatearPorcentaje } from '../services/calculations'

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
        <h2 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)'}}>{greeting}</h2>
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

  return (
    <div className="animate-fade-in">
      <h2 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)'}}>{greeting}</h2>
      
      {/* Main value card */}
      <div className="card" style={{background: 'var(--accent-gradient)', border: 'none', marginBottom: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', opacity: 0.85}}>
          <Wallet size={16} />
          <span style={{fontSize: '0.875rem'}}>Valor de tu cartera</span>
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

      {/* Chart */}
      {datosGrafico.length > 1 && (
        <div className="card" style={{marginBottom: '20px'}}>
          <h3 style={{fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px'}}>Evolución del Portfolio</h3>
          <div style={{width: '100%', height: 180}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGrafico}>
                <defs>
                  <linearGradient id="colorInvertido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="fecha" tick={{fontSize: 10, fill: 'var(--text-tertiary)'}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 10, fill: 'var(--text-tertiary)'}} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `€${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={(value) => formatearMoneda(value)} contentStyle={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem'}} />
                <Area type="monotone" dataKey="invertido" stroke="#6366f1" fillOpacity={1} fill="url(#colorInvertido)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ETF Breakdown */}
      <h3 style={{fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px'}}>Mis ETFs</h3>
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
              <span>{resumen.totalParticipaciones.toFixed(4)} part.</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
