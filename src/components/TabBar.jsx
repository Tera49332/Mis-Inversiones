import { LayoutDashboard, Receipt, BarChart3, ClipboardCheck, Settings } from 'lucide-react'

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'compras', label: 'Compras', icon: Receipt },
  { id: 'graficos', label: 'Gráficos', icon: BarChart3 },
  { id: 'evaluacion', label: 'Evaluación', icon: ClipboardCheck },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={22} />
            <span className="tab-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
