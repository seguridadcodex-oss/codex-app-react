import { useState } from 'react'
import { useCollection } from '../hooks/useFirestore'
import Dashboard from './Dashboard'
import Clientes from './Clientes'
import { Registros, Calendario, Precios } from './Views'

const TABS = [
  { id: 'dashboard', label: 'Inicio', icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'clientes', label: 'Clientes', icon: <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/></svg> },
  { id: 'registros', label: 'Registros', icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'calendario', label: 'Agenda', icon: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'precios', label: 'Precios', icon: <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
]

export default function AdminPanel({ db, onExit }) {
  const [tab, setTab] = useState('dashboard')
  const clientes = useCollection(db, 'clientes')
  const registros = useCollection(db, 'registros')
  const visitas = useCollection(db, 'visitasProg')

  const synced = clientes.synced && registros.synced && visitas.synced

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <span className="header-logo-text">CODEX</span>
        </div>
        <div className="header-right">
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>
            {clientes.data.length} clientes
          </div>
          <div className={`sync-dot ${synced ? 'ok' : ''}`} title={synced ? 'Sincronizado' : 'Sincronizando...'} />
          <button className="mode-btn" onClick={onExit}>⇄ Modo</button>
        </div>
      </header>

      <main className="main">
        {tab === 'dashboard' && <Dashboard clientes={clientes} registros={registros} visitas={visitas} onTab={setTab} />}
        {tab === 'clientes' && <Clientes clientes={clientes} registros={registros} />}
        {tab === 'registros' && <Registros registros={registros} clientes={clientes} visitas={visitas} />}
        {tab === 'calendario' && <Calendario visitas={visitas} clientes={clientes} />}
        {tab === 'precios' && <Precios clientes={clientes} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
