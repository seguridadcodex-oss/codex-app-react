import { useState } from 'react'

const DEFAULT_PIN = '1234'
const getPin = () => localStorage.getItem('codex_pin') || DEFAULT_PIN

export default function PinScreen({ onSuccess, onBack }) {
  const [buffer, setBuffer] = useState('')
  const [mode, setMode] = useState(() => !localStorage.getItem('codex_pin') ? 'set1' : 'verify')
  const [temp, setTemp] = useState('')
  const [msg, setMsg] = useState(() => !localStorage.getItem('codex_pin') ? 'Elegí 4 dígitos para proteger el panel' : '')
  const [subtitle, setSubtitle] = useState(() => !localStorage.getItem('codex_pin') ? 'Creá tu PIN de administrador' : 'Ingresá tu PIN')
  const [dotErr, setDotErr] = useState(false)

  const press = (d) => {
    if (buffer.length >= 4) return
    const next = buffer + d
    setBuffer(next)
    if (next.length === 4) setTimeout(() => submit(next), 120)
  }

  const del = () => {
    setBuffer(b => b.slice(0, -1))
    setMsg('')
    setDotErr(false)
  }

  const submit = (buf) => {
    if (mode === 'verify') {
      if (buf === getPin()) {
        onSuccess()
      } else {
        setDotErr(true)
        setMsg('PIN incorrecto. Intentá de nuevo.')
        setTimeout(() => { setBuffer(''); setDotErr(false); setMsg('') }, 900)
      }
    } else if (mode === 'set1') {
      setTemp(buf)
      setBuffer('')
      setSubtitle('Confirmá tu nuevo PIN')
      setMsg('')
      setMode('set2')
    } else if (mode === 'set2') {
      if (buf === temp) {
        localStorage.setItem('codex_pin', buf)
        onSuccess()
      } else {
        setDotErr(true)
        setMsg('No coinciden. Empezá de nuevo.')
        setTimeout(() => {
          setBuffer(''); setTemp(''); setDotErr(false)
          setMode('set1')
          setSubtitle('Creá tu PIN de administrador')
          setMsg('Elegí 4 dígitos para proteger el panel')
        }, 1000)
      }
    }
  }

  const changePin = () => {
    setMode('set1'); setBuffer(''); setTemp('')
    setSubtitle('Creá un nuevo PIN'); setMsg('Elegí 4 dígitos')
  }

  return (
    <div className="pin-screen">
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div className="pin-logo">CODEX</div>
        <div style={{ fontSize: 10, color: '#4a6080', textTransform: 'uppercase', letterSpacing: '.12em' }}>Fumigaciones</div>
      </div>

      <div className="pin-sub">{subtitle}</div>

      <div className="pin-dots">
        {[0,1,2,3].map(i => (
          <div key={i} className={`pin-dot ${i < buffer.length ? (dotErr ? 'error' : 'filled') : ''}`} />
        ))}
      </div>

      <div className={`pin-msg ${dotErr ? 'error' : ''}`}>{msg}</div>

      <div className="pin-grid">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="pin-key" onClick={() => press(String(n))}>{n}</button>
        ))}
        <button className="pin-key empty" />
        <button className="pin-key" onClick={() => press('0')}>0</button>
        <button className="pin-key del" onClick={del}>⌫</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 20 }}>
        {mode === 'verify' && (
          <button className="pin-change" onClick={changePin}>Cambiar PIN</button>
        )}
        <button className="pin-change" onClick={onBack}>← Volver</button>
      </div>
    </div>
  )
}
