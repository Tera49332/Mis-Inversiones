import { useState, useEffect } from 'react'
import PinLock from './components/PinLock'
import TabBar from './components/TabBar'
import Header from './components/Header'
import Dashboard from './views/Dashboard'
import Compras from './views/Compras'
import Graficos from './views/Graficos'
import Evaluacion from './views/Evaluacion'
import Ajustes from './views/Ajustes'

const TAB_TITLES = {
  resumen: 'Resumen',
  compras: 'Compras',
  graficos: 'Gráficos',
  evaluacion: 'Evaluación',
  ajustes: 'Ajustes'
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [activeTab, setActiveTab] = useState('resumen')
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Check if already unlocked this session
    const unlocked = sessionStorage.getItem('app_unlocked')
    if (unlocked === 'true') {
      setIsUnlocked(true)
    }
  }, [])

  const handleUnlock = () => {
    sessionStorage.setItem('app_unlocked', 'true')
    setIsUnlocked(true)
  }

  const handleTabChange = (tab) => {
    if (tab === activeTab) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveTab(tab)
      setIsTransitioning(false)
    }, 150)
  }

  if (!isUnlocked) {
    return <PinLock onUnlock={handleUnlock} />
  }

  const renderView = () => {
    switch (activeTab) {
      case 'resumen':
        return <Dashboard onNavigate={handleTabChange} />
      case 'compras':
        return <Compras />
      case 'graficos':
        return <Graficos />
      case 'evaluacion':
        return <Evaluacion />
      case 'ajustes':
        return <Ajustes />
      default:
        return <Dashboard onNavigate={handleTabChange} />
    }
  }

  return (
    <div className="app">
      <Header title={TAB_TITLES[activeTab]} />
      <main className={`main-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {renderView()}
      </main>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}

export default App
