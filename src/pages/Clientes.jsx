import { useState } from 'react'
import { fmtNum, fmtDate, initials, today } from '../hooks/useFirestore'

function getPriceAlert(c) {
  if (!c.fechaAjuste) return 'urgente'
  const days = (new Date() - new Date(c.fechaAjuste)) / 86400000
  return days > 90 ? 'urgente' : days > 60 ? 'pronto' : null
}

const PLAGAS = ['Cucarachas','Ratas / Ratones','Mosquitos','Hormigas','Arañas','Vinchucas','Termitas','Ninguna']
const SERVICIOS = ['Limpieza de tanques','Fumigación','Redes de seguridad','Redes de sombra']

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

function ClienteForm({ initial = {}, onSave, onClose, title }) {
  const [form, setForm] = useState({
    nombre: '', tipo: 'Vivienda', frecuencia: 'Mensual', direccion: '', tel: '',
    precio: '', fechaAlta: today(), fechaAjuste: today(), notas: '', servicios: [],
    ...initial
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSvc = (s) => set('servicios', form.servicios.includes(s) ? form.servicios.filter(x => x !== s) : [...form.servicios, s])

  const save = () => {
    if (!form.nombre.trim()) { alert('Ingresá el nombre'); return }
    onSave({ ...form, precio: parseFloat(form.precio) || 0, id: initial.id || Date.now() })
  }

  return (
    <Modal title={title} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}>Guardar</button>
      </>}>
      <div className="form-group">
        <label className="form-label">Nombre / Razón social</label>
        <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Consorcio Corrientes 1200" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {['Vivienda','Consorcio','Empresa','Oficina','Escuela'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Frecuencia</label>
          <select className="form-select" value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)}>
            {['Mensual','Bimestral','Trimestral','Único'].map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Dirección</label>
        <input className="form-input" value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Av. Corrientes 1200, CABA" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input className="form-input" value={form.tel} onChange={e => set('tel', e.target.value)} placeholder="11 1234-5678" />
        </div>
        <div className="form-group">
          <label className="form-label">Precio ($)</label>
          <input className="form-input" type="number" inputMode="numeric" value={form.precio} onChange={e => set('precio', e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha de alta</label>
          <input className="form-input" type="date" value={form.fechaAlta} onChange={e => set('fechaAlta', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Último ajuste</label>
          <input className="form-input" type="date" value={form.fechaAjuste} onChange={e => set('fechaAjuste', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Servicios contratados</label>
        <div className="pill-group">
          {SERVICIOS.map(s => (
            <span key={s} className={`pill ${form.servicios?.includes(s) ? 'on' : ''}`} onClick={() => toggleSvc(s)}>{s}</span>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Notas</label>
        <textarea className="form-textarea" value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Acceso, contacto, particularidades..." />
      </div>
    </Modal>
  )
}

export default function Clientes({ clientes, registros }) {
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null) // null | 'new' | {cliente}
  const [editing, setEditing] = useState(null)

  const filtered = clientes.data.filter(c =>
    c.nombre?.toLowerCase().includes(q.toLowerCase()) ||
    (c.direccion || '').toLowerCase().includes(q.toLowerCase())
  )

  const save = async (data) => {
    await clientes.save(data)
    setModal(null)
    setEditing(null)
  }

  const del = async (c) => {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return
    await clientes.remove(c.id)
    setModal(null)
  }

  const ver = modal && typeof modal === 'object'

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Clientes</div>
          <div className="section-sub">{clientes.data.length} registrados</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>+ Nuevo</button>
      </div>

      <div className="search-bar">
        <span className="search-icon">⌕</span>
        <input type="text" placeholder="Buscar cliente o dirección..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <div className="empty-text">{q ? 'Sin resultados' : 'Sin clientes registrados'}</div>
          <div className="empty-sub">{!q && 'Tocá + Nuevo para empezar'}</div>
        </div>
      ) : filtered.map(c => {
        const al = getPriceAlert(c)
        return (
          <div key={c.id} className="card card-row" onClick={() => setModal(c)}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--blue-dim)', border: '1px solid rgba(0,51,102,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--navy)', flexShrink: 0 }}>
              {initials(c.nombre)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.tipo} · {c.frecuencia}{c.direccion ? ' · ' + c.direccion : ''}</div>
              <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {al === 'urgente' && <span className="badge badge-red">Ajustar precio</span>}
                {al === 'pronto' && <span className="badge badge-amber">Ajustar pronto</span>}
                <span className="badge badge-blue">{c.frecuencia}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600 }}>${fmtNum(c.precio)}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>últ. ajuste<br />{c.fechaAjuste || '—'}</div>
            </div>
          </div>
        )
      })}

      {modal === 'new' && (
        <ClienteForm title="Nuevo cliente" onClose={() => setModal(null)} onSave={save} />
      )}

      {editing && (
        <ClienteForm title="Editar cliente" initial={editing} onClose={() => setEditing(null)} onSave={save} />
      )}

      {ver && !editing && (
        <Modal title={modal.nombre} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-danger btn-sm" onClick={() => del(modal)}>Eliminar</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(modal); setModal(null) }}>✎ Editar</button>
          </>}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 12 }}>
            {[['Tipo', modal.tipo], ['Frecuencia', modal.frecuencia], ['Dirección', modal.direccion || '—'],
              ['Teléfono', modal.tel || '—'], ['Precio', '$' + fmtNum(modal.precio) + '/mes'],
              ['Último ajuste', fmtDate(modal.fechaAjuste)], ['Alta', fmtDate(modal.fechaAlta)]
            ].map(([l, v]) => (
              <tr key={l}>
                <td style={{ color: 'var(--text3)', padding: '5px 0', width: '45%' }}>{l}</td>
                <td style={{ padding: '5px 0', fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </table>
          {modal.servicios?.length > 0 && (
            <div className="tag-list" style={{ marginBottom: 10 }}>
              {modal.servicios.map(s => <span key={s} className="tag">{s}</span>)}
            </div>
          )}
          {modal.notas && <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--surface2)', padding: '8px 10px', borderRadius: 'var(--rsm)' }}>{modal.notas}</div>}
          <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Últimas visitas</div>
          {registros.data.filter(r => r.clienteId === modal.id).slice(-3).reverse().map(r => (
            <div key={r.id} style={{ padding: '7px 10px', background: 'var(--surface2)', borderRadius: 'var(--rsm)', marginBottom: 5, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--navy)' }}>{r.fecha}</span>
              <span style={{ color: 'var(--text3)' }}>{r.plagas?.join(', ') || 'Sin plagas'}</span>
            </div>
          ))}
          {registros.data.filter(r => r.clienteId === modal.id).length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Sin registros aún</div>
          )}
        </Modal>
      )}
    </div>
  )
}
