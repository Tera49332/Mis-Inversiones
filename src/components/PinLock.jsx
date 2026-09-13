import { useState, useEffect } from 'react'
import { Delete, TrendingUp } from 'lucide-react'

const CORRECT_PIN = '3525'

export default function PinLock({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  const handleKeyClick = (key) => {
    if (pin.length < 4) {
      const newPin = pin + key
      setPin(newPin)
      if (newPin.length === 4) {
        verifyPin(newPin)
      }
    }
  }

  const handleDelete = () => {
    setPin(pin.slice(0, -1))
    setError(false)
  }

  const verifyPin = (enteredPin) => {
    if (enteredPin === CORRECT_PIN) {
      setUnlocking(true)
      setTimeout(() => {
        onUnlock()
      }, 400)
    } else {
      setError(true)
      setTimeout(() => {
        setPin('')
        setError(false)
      }, 600)
    }
  }

  return (
    <div className={`pin-screen ${unlocking ? 'pin-unlocking' : ''}`}>
      <div className="pin-header">
        <div className="pin-logo">
          <TrendingUp size={44} strokeWidth={2.5} />
        </div>
        <h1 className="pin-title">Mi Inversión ETF</h1>
        <p className="pin-subtitle">Introduce tu PIN para continuar</p>
      </div>

      <div className={`pin-dots ${error ? 'shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
        ))}
      </div>

      {error && <p className="pin-error-text">PIN incorrecto</p>}

      <div className="pin-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} className="pin-btn" onClick={() => handleKeyClick(num.toString())}>
            {num}
          </button>
        ))}
        <div className="pin-btn empty"></div>
        <button className="pin-btn" onClick={() => handleKeyClick('0')}>0</button>
        <button className="pin-btn" onClick={handleDelete}>
          <Delete size={22} />
        </button>
      </div>
    </div>
  )
}
