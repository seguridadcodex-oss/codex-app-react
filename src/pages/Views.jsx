import { useState } from 'react'
import { fmtNum, fmtDate, today } from '../hooks/useFirestore'

// ─── SHARED MODAL ────────────────────────────────────────
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

function Pills({ options, selected, onChange }) {
  const toggle = (o) => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])
  return (
    <div className="pill-group">
      {options.map(o => <span key={o} className={`pill ${selected.includes(o) ? 'on' : ''}`} onClick={() => toggle(o)}>{o}</span>)}
    </div>
  )
}

// ─── REGISTROS ───────────────────────────────────────────
const PLAGAS = ['Cucarachas','Ratas / Ratones','Mosquitos','Hormigas','Arañas','Vinchucas','Termitas','Ninguna']
const PRODUCTOS = ['Insecticida residual','Gel cucarachas','Cebo rodenticida','Nebulización','Termonebulización','ULV frío','Larvicida']
const AREAS = ['Cocina','Baños','Sala técnica','Sótano','Patio / Exterior','Depósito','Todos los ambientes']
const SECTORES_EDU = ['Nivel primario','Nivel secundario','Jardín / Inicial','Depósito','Comedor escolar','Gimnasio / SUM','Patio / Exterior','Dirección / Administración','Todos los sectores']

export function Registros({ registros, clientes, visitas }) {
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ clienteId: '', fecha: today(), tecnico: '', plagas: [], productos: [], areas: [], sectores: [], nivel: '', obs: '', proxima: '' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const clienteActual = clientes.data.find(c => String(c.id) === String(form.clienteId))
  const esEscuela = clienteActual?.tipo === 'Escuela'

  const filtered = [...registros.data]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .filter(r => {
      if (!q) return true
      const c = clientes.data.find(x => x.id === r.clienteId)
      return c?.nombre.toLowerCase().includes(q.toLowerCase())
    })

  const save = async () => {
    if (!form.clienteId || !form.fecha) { alert('Completá cliente y fecha'); return }
    const r = { ...form, id: Date.now(), clienteId: parseInt(form.clienteId) || form.clienteId, origen: 'admin' }
    await registros.save(r)
    if (r.proxima) await visitas.save({ id: Date.now() + 1, clienteId: r.clienteId, fecha: r.proxima, notas: 'Auto desde registro' })
    setModal(false)
    setForm({ clienteId: '', fecha: today(), tecnico: '', plagas: [], productos: [], areas: [], sectores: [], nivel: '', obs: '', proxima: '' })
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Registros</div>
          <div className="section-sub">{registros.data.length} visitas</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Cargar</button>
      </div>

      <div className="search-bar">
        <span className="search-icon">⌕</span>
        <input type="text" placeholder="Buscar por cliente..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">◎</div><div className="empty-text">Sin registros aún</div></div>
      ) : filtered.map(r => {
        const c = clientes.data.find(x => x.id === r.clienteId)
        const nivelColor = r.nivel === 'Alto' ? 'badge-red' : r.nivel === 'Moderado' ? 'badge-amber' : r.nivel === 'Bajo' ? 'badge-green' : ''
        return (
          <div key={r.id} className="card card-body" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c?.nombre || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{fmtDate(r.fecha)}{r.tecnico ? ' · ' + r.tecnico : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {r.nivel && <span className={`badge ${nivelColor}`}>{r.nivel}</span>}
                {r.origen === 'fumigador' && <span className="badge badge-blue">Fumigador</span>}
              </div>
            </div>
            {r.plagas?.length > 0 && <div className="tag-list">{r.plagas.map(p => <span key={p} className="tag">{p}</span>)}</div>}
            {r.productos?.length > 0 && <div className="tag-list" style={{ marginTop: 4 }}>{r.productos.map(p => <span key={p} className="tag" style={{ color: 'var(--navy)' }}>{p}</span>)}</div>}
            {r.sectores?.length > 0 && <div className="tag-list" style={{ marginTop: 4 }}>{r.sectores.map(s => <span key={s} className="tag" style={{ color: 'var(--cta)' }}>{s}</span>)}</div>}
            {r.obs && <div style={{ fontSize: 12, color: 'var(--text2)', padding: '7px 9px', background: 'var(--surface2)', borderRadius: 'var(--rsm)', marginTop: 8, lineHeight: 1.5 }}>{r.obs}</div>}
            {r.proxima && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--cta)' }}>Próxima: {fmtDate(r.proxima)}</div>}
          </div>
        )
      })}

      {modal && (
        <Modal title="Registrar fumigación" onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Guardar</button></>}>
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select className="form-select" value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
              <option value="">Seleccioná...</option>
              {clientes.data.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Técnico</label><input className="form-input" value={form.tecnico} onChange={e => set('tecnico', e.target.value)} placeholder="Nombre" /></div>
          </div>
          <div className="form-group"><label className="form-label">Plagas encontradas</label><Pills options={PLAGAS} selected={form.plagas} onChange={v => set('plagas', v)} /></div>
          <div className="form-group"><label className="form-label">Productos</label><Pills options={PRODUCTOS} selected={form.productos} onChange={v => set('productos', v)} /></div>
          <div className="form-group"><label className="form-label">Áreas tratadas</label><Pills options={AREAS} selected={form.areas} onChange={v => set('areas', v)} /></div>
          {esEscuela && <div className="form-group"><label className="form-label">Sectores educativos</label><Pills options={SECTORES_EDU} selected={form.sectores} onChange={v => set('sectores', v)} /></div>}
          <div className="form-group">
            <label className="form-label">Nivel de infestación</label>
            <select className="form-select" value={form.nivel} onChange={e => set('nivel', e.target.value)}>
              <option value="">— Sin plagas —</option>
              <option value="Bajo">Bajo</option><option value="Moderado">Moderado</option><option value="Alto">Alto</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Observaciones</label><textarea className="form-textarea" value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Estado, recomendaciones..." /></div>
          <div className="form-group"><label className="form-label">Próxima visita</label><input className="form-input" type="date" value={form.proxima} onChange={e => set('proxima', e.target.value)} /></div>
        </Modal>
      )}
    </div>
  )
}

// ─── CALENDARIO ──────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS = ['D','L','M','X','J','V','S']

export function Calendario({ visitas, clientes }) {
  const [cal, setCal] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() } })
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ clienteId: '', fecha: today(), notas: '' })

  const prev = () => setCal(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 })
  const next = () => setCal(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 })

  const fd = new Date(cal.y, cal.m, 1).getDay()
  const dim = new Date(cal.y, cal.m + 1, 0).getDate()
  const tn = new Date()
  const vm = {}
  visitas.data.forEach(v => {
    const d = new Date(v.fecha + 'T12:00:00')
    if (d.getFullYear() === cal.y && d.getMonth() === cal.m) {
      const day = d.getDate(); vm[day] = (vm[day] || 0) + 1
    }
  })

  const monthVisits = visitas.data
    .filter(v => { const d = new Date(v.fecha + 'T12:00:00'); return d.getFullYear() === cal.y && d.getMonth() === cal.m })
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const save = async () => {
    if (!form.clienteId || !form.fecha) { alert('Completá cliente y fecha'); return }
    await visitas.save({ id: Date.now(), clienteId: parseInt(form.clienteId) || form.clienteId, fecha: form.fecha, notas: form.notas })
    setModal(false)
    setForm({ clienteId: '', fecha: today(), notas: '' })
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Calendario</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Programar</button>
      </div>

      <div className="card card-body">
        <div className="cal-nav">
          <button onClick={prev}>‹</button>
          <div className="cal-month">{MONTHS[cal.m]} {cal.y}</div>
          <button onClick={next}>›</button>
        </div>
        <div className="cal-grid">
          {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
          {Array(fd).fill(null).map((_, i) => <div key={'e'+i} style={{ aspectRatio: 1 }} />)}
          {Array(dim).fill(null).map((_, i) => {
            const d = i + 1
            const isT = d === tn.getDate() && cal.m === tn.getMonth() && cal.y === tn.getFullYear()
            return (
              <div key={d} className={`cal-day ${isT ? 'today' : ''} ${vm[d] ? 'has-visit' : ''}`}>
                {d}
                {vm[d] && <div className="cal-day-count">{vm[d]}</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 8 }}>
        <div className="section-title">Visitas de {MONTHS[cal.m]}</div>
      </div>
      {monthVisits.length === 0 ? (
        <div className="empty-state" style={{ padding: 20 }}><div className="empty-text">Sin visitas programadas</div></div>
      ) : monthVisits.map(v => {
        const c = clientes.data.find(x => x.id === v.clienteId)
        return (
          <div key={v.id} className="visit-row">
            <div className="visit-badge">{fmtDate(v.fecha)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c?.nombre || '—'}</div>
              {v.notas && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{v.notas}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => visitas.remove(v.id)}>×</button>
          </div>
        )
      })}

      {modal && (
        <Modal title="Programar visita" onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Programar</button></>}>
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select className="form-select" value={form.clienteId} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}>
              <option value="">Seleccioná...</option>
              {clientes.data.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Fecha</label><input className="form-input" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Notas</label><input className="form-input" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Hora, instrucciones..." /></div>
        </Modal>
      )}
    </div>
  )
}

// ─── PRECIOS ─────────────────────────────────────────────
export function Precios({ clientes }) {
  const [pct, setPct] = useState(30)

  const sorted = [...clientes.data].sort((a, b) => {
    const order = (c) => { const al = getAl(c); return al === 'urgente' ? 0 : al === 'pronto' ? 1 : 2 }
    return order(a) - order(b)
  })

  function getAl(c) {
    if (!c.fechaAjuste) return 'urgente'
    const d = (new Date() - new Date(c.fechaAjuste)) / 86400000
    return d > 90 ? 'urgente' : d > 60 ? 'pronto' : null
  }

  const totalAct = clientes.data.reduce((s, c) => s + (c.precio || 0), 0)
  const totalNew = clientes.data.reduce((s, c) => s + Math.round((c.precio || 0) * (1 + pct / 100)), 0)

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Ajuste de precios</div><div className="section-sub">Calculá el nuevo precio por inflación</div></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rsm)' }}>
        <label style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>% inflación a aplicar</label>
        <input type="number" value={pct} onChange={e => setPct(parseFloat(e.target.value) || 0)} style={{ width: 72, padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 'var(--rsm)', fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, textAlign: 'center', outline: 'none', color: 'var(--navy)' }} />
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>%</span>
      </div>

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {sorted.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}><div className="empty-text">Cargá clientes primero</div></div>
        ) : sorted.map(c => {
          const nv = Math.round((c.precio || 0) * (1 + pct / 100))
          const al = getAl(c)
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border)', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>ajuste: {c.fechaAjuste || '—'}</div>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>${fmtNum(c.precio)}</div>
              <div style={{ color: 'var(--text3)', padding: '0 4px' }}>→</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--navy)', minWidth: 70, textAlign: 'right' }}>${fmtNum(nv)}</div>
              <span className={`badge ${al === 'urgente' ? 'badge-red' : al === 'pronto' ? 'badge-amber' : 'badge-green'}`}>
                {al === 'urgente' ? 'Ajustar' : al === 'pronto' ? 'Pronto' : 'OK'}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12, padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--rsm)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div><div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>${fmtNum(totalAct)}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Actual/mes</div></div>
        <div style={{ color: 'var(--text3)', fontSize: 16, paddingTop: 2 }}>→</div>
        <div><div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>${fmtNum(totalNew)}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Nuevo/mes</div></div>
        <div><div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--cta)' }}>+${fmtNum(totalNew - totalAct)}</div><div style={{ fontSize: 10, color: 'var(--text3)' }}>Diferencia</div></div>
      </div>
    </div>
  )
}
