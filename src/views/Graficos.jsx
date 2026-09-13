import { useState, useMemo } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import { usePortfolio } from '../hooks/usePortfolio'
import { formatearMoneda } from '../services/calculations'

export default function Graficos() {
  const { compras, etfs, getDatosGrafico, isLoading } = usePortfolio()
  const [periodo, setPeriodo] = useState('all')

  const rawDatosGrafico = getDatosGrafico()
  
  const datosGrafico = useMemo(() => {
    if (!rawDatosGrafico || rawDatosGrafico.length === 0) return []
    if (periodo === 'all') return rawDatosGrafico
    
    const hoy = new Date()
    let msToSubtract = 0
    if (periodo === '1m') msToSubtract = 30 * 24 * 60 * 60 * 1000
    if (periodo === '6m') msToSubtract = 182 * 24 * 60 * 60 * 1000
    if (periodo === '1y') msToSubtract = 365 * 24 * 60 * 60 * 1000
    
    const limitDate = new Date(hoy.getTime() - msToSubtract).toISOString().split('T')[0]
    return rawDatosGrafico.filter(d => d.fecha >= limitDate)
  }, [rawDatosGrafico, periodo])
  
  const distribucionData = useMemo(() => {
    if (!compras || !etfs) return []
    const dist = etfs.map(etf => {
      const totalEtf = compras
        .filter(c => c.etfId === etf.id)
        .reduce((sum, c) => sum + c.importe, 0)
      return { name: etf.ticker, value: totalEtf }
    }).filter(d => d.value > 0)
    return dist
  }, [compras, etfs])

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444']

  if (isLoading) return <div className="empty-state"><div className="empty-message">Cargando...</div></div>

  if (!compras || compras.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="empty-state">
          <PieChartIcon size={48} className="empty-icon" />
          <h3 className="empty-title">Sin datos suficientes</h3>
          <p className="empty-message">Añade compras para visualizar los gráficos de tu cartera</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="card" style={{marginBottom: '20px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
          <h3 style={{fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)'}}>Evolución de tu cartera</h3>
        </div>
        
        <div className="filter-tabs" style={{marginBottom: '16px'}}>
          <button className={`filter-tab ${periodo === '1m' ? 'active' : ''}`} onClick={() => setPeriodo('1m')}>1M</button>
          <button className={`filter-tab ${periodo === '6m' ? 'active' : ''}`} onClick={() => setPeriodo('6m')}>6M</button>
          <button className={`filter-tab ${periodo === '1y' ? 'active' : ''}`} onClick={() => setPeriodo('1y')}>1A</button>
          <button className={`filter-tab ${periodo === 'all' ? 'active' : ''}`} onClick={() => setPeriodo('all')}>Todo</button>
        </div>

        {datosGrafico.length > 0 ? (
          <div style={{width: '100%', height: 250}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGrafico}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvertido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="fecha" tick={{fontSize: 10, fill: 'var(--text-tertiary)'}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 10, fill: 'var(--text-tertiary)'}} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => formatearMoneda(v)} />
                <Tooltip formatter={(value) => formatearMoneda(value)} contentStyle={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'}} itemStyle={{color: 'var(--text-primary)'}} />
                <Legend wrapperStyle={{fontSize: '0.8rem'}} />
                <Area type="monotone" dataKey="valorActual" name="Valor Actual" stroke="#10b981" fillOpacity={1} fill="url(#colorValor)" strokeWidth={2} />
                <Area type="monotone" dataKey="invertido" name="Invertido" stroke="#6366f1" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorInvertido)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state" style={{padding: '20px 0'}}>
            <p className="empty-message">No hay datos en el periodo seleccionado</p>
          </div>
        )}
      </div>

      {distribucionData.length > 0 && (
        <div className="card" style={{marginBottom: '20px'}}>
          <h3 style={{fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px'}}>Distribución de Cartera</h3>
          <div style={{width: '100%', height: 250, display: 'flex', justifyContent: 'center'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribucionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distribucionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatearMoneda(value)} contentStyle={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)'}} itemStyle={{color: 'var(--text-primary)'}} />
                <Legend wrapperStyle={{fontSize: '0.875rem', color: 'var(--text-secondary)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
