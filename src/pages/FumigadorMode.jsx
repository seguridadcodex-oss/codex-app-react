import { useState } from 'react'
import { today, initials, fmtDate } from '../hooks/useFirestore'

const PLAGAS = ['Cucarachas','Ratas / Ratones','Mosquitos','Hormigas','Arañas','Vinchucas','Termitas','Ninguna']
const PRODUCTOS = ['Insecticida residual','Gel cucarachas','Cebo rodenticida','Nebulización','Termonebulización','ULV frío','Larvicida']
const AREAS = ['Cocina','Baños','Sala técnica','Sótano','Patio / Exterior','Depósito','Todos los ambientes']
const SECTORES_EDU = ['Nivel primario','Nivel secundario','Jardín / Inicial','Depósito','Comedor escolar','Gimnasio / SUM','Patio / Exterior','Dirección / Administración','Todos los sectores']

function FumPill({ label, selected, onToggle }) {
  return <span className={`fum-pill ${selected ? 'on' : ''}`} onClick={onToggle}>{label}</span>
}

function Pills({ options, selected, onChange }) {
  const toggle = (o) => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])
  return <div className="pill-group">{options.map(o => <FumPill key={o} label={o} selected={selected.includes(o)} onToggle={() => toggle(o)} />)}</div>
}

function StepDots({ total, current }) {
  return (
    <div className="fum-step-dots">
      {Array(total).fill(null).map((_, i) => <div key={i} className={`fum-step-dot ${i <= current ? 'done' : ''}`} />)}
    </div>
  )
}

export default function FumigadorMode({ db, onExit }) {
  const [mode, setMode] = useState('menu') // menu | registro | cotizar
  const [step, setStep] = useState(0)
  const [selId, setSelId] = useState(null)
  const [q, setQ] = useState('')
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState({ plagas: [], productos: [], areas: [], sectores: [], nivel: '', tecnico: '', obs: '', proxima: '' })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load clientes from Firestore
  useState(() => {
    if (!db) return
    import('firebase/firestore').then(({ collection, getDocs }) => {
      getDocs(collection(db, 'codex_clientes')).then(snap => {
        setClientes(snap.docs.map(d => d.data()))
      })
    })
  })

  const filtered = q ? clientes.filter(c => c.nombre?.toLowerCase().includes(q.toLowerCase()) || (c.direccion || '').toLowerCase().includes(q.toLowerCase())) : clientes
  const selCliente = clientes.find(c => c.id === selId)
  const esEscuela = selCliente?.tipo === 'Escuela'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!selId) return
    setLoading(true)
    const { doc, setDoc, collection } = await import('firebase/firestore')
    const r = { id: Date.now(), clienteId: selId, fecha: today(), ...form, origen: 'fumigador' }
    await setDoc(doc(db, 'codex_registros', String(r.id)), r)
    if (r.proxima) await setDoc(doc(db, 'codex_visitasProg', String(r.id + 1)), { id: r.id + 1, clienteId: selId, fecha: r.proxima, notas: 'Auto desde fumigador' })
    setLoading(false)
    setDone(true)
  }

  const reset = () => { setMode('menu'); setStep(0); setSelId(null); setQ(''); setForm({ plagas: [], productos: [], areas: [], sectores: [], nivel: '', tecnico: '', obs: '', proxima: '' }); setDone(false) }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628' }}>
      <div className="fum-header">
        <div className="fum-logo">CODEX</div>
        <div className="fum-badge">FUMIGADOR</div>
        <button className="fum-back" onClick={onExit}>← Salir</button>
      </div>

      <div className="fum-body">
        {/* MENU */}
        {mode === 'menu' && (
          <div>
            <div className="fum-title">¿Qué querés hacer?</div>
            <div className="fum-sub" style={{ marginBottom: 24 }}>Elegí una opción para continuar</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 14, background: '#111e2e', border: '1px solid #1e2e40', borderRadius: 'var(--r)', marginBottom: 10, cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
              onClick={() => setMode('registro')}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--cta)'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#1e2e40'}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(46,139,87,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5cb85c', fontSize: 18, flexShrink: 0 }}>✓</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Registrar visita realizada</div>
                <div style={{ fontSize: 12, color: '#4a6080', marginTop: 2 }}>Cargá los detalles de una fumigación terminada</div>
              </div>
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 14, background: '#111e2e', border: '1px solid #1e2e40', borderRadius: 'var(--r)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
              onClick={() => setMode('cotizar')}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--cta)'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#1e2e40'}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(46,139,87,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5cb85c', fontSize: 18, flexShrink: 0 }}>$</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Hacer un presupuesto</div>
                <div style={{ fontSize: 12, color: '#4a6080', marginTop: 2 }}>Cotizá un local o empresa en el momento</div>
              </div>
            </button>
          </div>
        )}

        {/* REGISTRO */}
        {mode === 'registro' && !done && (
          <div>
            {step === 0 && (
              <div>
                <div className="fum-title">Registrar visita</div>
                <div className="fum-sub">¿A qué cliente terminaste de fumigar?</div>
                <StepDots total={4} current={0} />
                <div className="fum-section-label">Cliente</div>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#4a6080', fontSize: 15, pointerEvents: 'none' }}>⌕</span>
                  <input className="fum-input" style={{ paddingLeft: 34 }} type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente..." />
                </div>
                {filtered.map(c => (
                  <button key={c.id} className={`fum-client-btn ${selId === c.id ? 'selected' : ''}`} onClick={() => setSelId(c.id)}>
                    <div style={{ width: 36, height: 36, borderRadius: 7, background: 'rgba(46,139,87,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#5cb85c', flexShrink: 0 }}>{initials(c.nombre)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</div>
                      <div style={{ fontSize: 11, color: '#4a6080', marginTop: 1 }}>{c.tipo}{c.direccion ? ' · ' + c.direccion : ''}</div>
                    </div>
                    {selId === c.id && <div style={{ color: '#5cb85c', fontSize: 18 }}>✓</div>}
                  </button>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ background: '#111e2e', color: '#4a6080', border: '1px solid #1e2e40' }} onClick={() => setMode('menu')}>← Volver</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { if (!selId) { alert('Seleccioná un cliente'); return } setStep(1) }}>Continuar →</button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="fum-title">Plagas y productos</div>
                <div className="fum-sub">{selCliente?.nombre}</div>
                <StepDots total={4} current={1} />
                <div className="form-group"><div className="fum-section-label">Plagas encontradas</div><Pills options={PLAGAS} selected={form.plagas} onChange={v => set('plagas', v)} /></div>
                <div className="form-group" style={{ marginTop: 14 }}><div className="fum-section-label">Productos utilizados</div><Pills options={PRODUCTOS} selected={form.productos} onChange={v => set('productos', v)} /></div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-ghost" style={{ background: '#111e2e', color: '#4a6080', border: '1px solid #1e2e40' }} onClick={() => setStep(0)}>← Volver</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>Continuar →</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="fum-title">Detalles del trabajo</div>
                <div className="fum-sub">{selCliente?.nombre}</div>
                <StepDots total={4} current={2} />
                <div className="form-group"><div className="fum-section-label">Áreas tratadas</div><Pills options={AREAS} selected={form.areas} onChange={v => set('areas', v)} /></div>
                {esEscuela && <div className="form-group" style={{ marginTop: 14 }}><div className="fum-section-label">Sectores educativos</div><Pills options={SECTORES_EDU} selected={form.sectores} onChange={v => set('sectores', v)} /></div>}
                <div className="form-group" style={{ marginTop: 14 }}>
                  <div className="fum-section-label">Nivel de infestación</div>
                  <select className="fum-select" value={form.nivel} onChange={e => set('nivel', e.target.value)}>
                    <option value="">— Sin plagas —</option>
                    <option value="Bajo">Bajo</option><option value="Moderado">Moderado</option><option value="Alto">Alto</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: 14 }}>
                  <div className="fum-section-label">Tu nombre</div>
                  <input className="fum-input" value={form.tecnico} onChange={e => set('tecnico', e.target.value)} placeholder="Ej: Martín" />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-ghost" style={{ background: '#111e2e', color: '#4a6080', border: '1px solid #1e2e40' }} onClick={() => setStep(1)}>← Volver</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(3)}>Continuar →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="fum-title">Observaciones</div>
                <div className="fum-sub">{selCliente?.nombre}</div>
                <StepDots total={4} current={3} />
                <div className="form-group">
                  <div className="fum-section-label">Observaciones (opcional)</div>
                  <textarea className="fum-textarea" value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Estado general, novedades para el dueño..." />
                </div>
                <div className="form-group" style={{ marginTop: 14 }}>
                  <div className="fum-section-label">Próxima visita sugerida</div>
                  <input className="fum-input" type="date" value={form.proxima} onChange={e => set('proxima', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="btn btn-ghost" style={{ background: '#111e2e', color: '#4a6080', border: '1px solid #1e2e40' }} onClick={() => setStep(2)}>← Volver</button>
                  <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={save} disabled={loading}>
                    {loading ? 'Guardando...' : '✓ Guardar visita'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONFIRMACION */}
        {mode === 'registro' && done && (
          <div>
            <div className="fum-confirm">
              <div className="fum-confirm-icon">✓</div>
              <div className="fum-confirm-title">¡Visita registrada!</div>
              <div className="fum-confirm-sub">{selCliente?.nombre} · {fmtDate(today())}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary btn-full" onClick={reset}>+ Registrar otra visita</button>
              <button className="btn btn-ghost btn-full" style={{ background: '#111e2e', color: '#4a6080', border: '1px solid #1e2e40' }} onClick={onExit}>Salir</button>
            </div>
          </div>
        )}

        {/* COTIZADOR (simplified for fumigador) */}
        {mode === 'cotizar' && (
          <div>
            <div className="fum-title">Presupuesto rápido</div>
            <div className="fum-sub" style={{ marginBottom: 20 }}>Completá los datos del local</div>
            <p style={{ color: '#5cb85c', fontSize: 13, marginBottom: 20 }}>
              Para el cotizador completo con cálculo de precios, usá el Panel de Administración → pestaña Cotizar.
            </p>
            <button className="btn btn-ghost btn-full" style={{ background: '#111e2e', color: '#4a6080', border: '1px solid #1e2e40' }} onClick={() => setMode('menu')}>← Volver</button>
          </div>
        )}
      </div>
    </div>
  )
}
