import { fmtNum, fmtDate } from '../hooks/useFirestore'

function getPriceAlert(c) {
  if (!c.fechaAjuste) return 'urgente'
  const days = (new Date() - new Date(c.fechaAjuste)) / 86400000
  return days > 90 ? 'urgente' : days > 60 ? 'pronto' : null
}

export default function Dashboard({ clientes, registros, visitas, onTab }) {
  const now = new Date()
  const mes = now.getMonth(), anio = now.getFullYear()

  const visitasMes = registros.data.filter(r => {
    const d = new Date(r.fecha + 'T12:00:00')
    return d.getMonth() === mes && d.getFullYear() === anio
  }).length

  const totalMes = clientes.data.reduce((s, c) => s + (c.precio || 0), 0)
  const alertas = clientes.data.filter(c => getPriceAlert(c))
  const proximas = visitas.data
    .filter(v => v.fecha >= now.toISOString().slice(0, 10))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 5)

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-val">{clientes.data.length}</div>
          <div className="stat-label">Clientes activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">${fmtNum(totalMes)}</div>
          <div className="stat-label">Facturación/mes</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{visitasMes}</div>
          <div className="stat-label">Visitas este mes</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{alertas.length}</div>
          <div className="stat-label">Alertas precio</div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">Alertas de precio</div>
      </div>
      {alertas.length === 0 ? (
        <div className="alert alert-green">
          <div className="alert-dot" />
          Sin alertas activas ✓
        </div>
      ) : alertas.map(c => {
        const a = getPriceAlert(c)
        return (
          <div key={c.id} className={`alert ${a === 'urgente' ? 'alert-red' : 'alert-amber'}`}>
            <div className="alert-dot" />
            <div style={{ flex: 1 }}><strong>{c.nombre}</strong> — {a === 'urgente' ? '+3 meses sin ajuste' : '+2 meses sin ajuste'}</div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>${fmtNum(c.precio)}</span>
          </div>
        )
      })}

      <div className="section-header" style={{ marginTop: 18 }}>
        <div className="section-title">Próximas visitas</div>
        <button className="btn btn-ghost btn-sm" onClick={() => onTab('calendario')}>Ver agenda</button>
      </div>
      {proximas.length === 0 ? (
        <div className="empty-state" style={{ padding: 16 }}>
          <div className="empty-text" style={{ fontSize: 13 }}>Sin visitas próximas programadas</div>
        </div>
      ) : proximas.map(v => {
        const c = clientes.data.find(x => x.id === v.clienteId)
        return (
          <div key={v.id} className="visit-row">
            <div className="visit-badge">{fmtDate(v.fecha)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c ? c.nombre : '—'}</div>
              {c && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.tipo}{c.direccion ? ' · ' + c.direccion : ''}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
