export default function Selector({ onAdmin, onFumigador }) {
  return (
    <div className="selector-screen">
      <div className="selector-logo">
        <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
            <rect x="4" y="4" width="40" height="40" rx="8" stroke="#2E8B57" strokeWidth="1.5"/>
            <rect x="10" y="10" width="28" height="28" rx="4" stroke="#2E8B57" strokeWidth="0.8" opacity="0.5"/>
            <circle cx="24" cy="24" r="5" fill="#2E8B57"/>
            <line x1="24" y1="4" x2="24" y2="44" stroke="#2E8B57" strokeWidth="0.5" opacity="0.3"/>
            <line x1="4" y1="24" x2="44" y2="24" stroke="#2E8B57" strokeWidth="0.5" opacity="0.3"/>
          </svg>
        </div>
        <div className="selector-logo-name">CODEX</div>
        <div className="selector-logo-sub">Fumigaciones</div>
      </div>

      <button className="selector-btn primary" onClick={onAdmin}>
        <div className="selector-btn-title">Panel de administración</div>
        <div className="selector-btn-sub">Clientes, precios, calendario y registros</div>
      </button>

      <button className="selector-btn" onClick={onFumigador}>
        <div className="selector-btn-title">Modo fumigador</div>
        <div className="selector-btn-sub">Registrar visita o hacer un presupuesto</div>
      </button>
    </div>
  )
}
