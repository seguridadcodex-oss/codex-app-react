import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore'

export function useCollection(db, colName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!db || !colName) return
    const unsub = onSnapshot(collection(db, `codex_${colName}`), (snap) => {
      setData(snap.docs.map(d => ({ ...d.data(), _docId: d.id })))
      setLoading(false)
      setSynced(true)
    }, (err) => {
      console.error('Firestore error:', err)
      setLoading(false)
    })
    return unsub
  }, [db, colName])

  const save = async (item) => {
    const docRef = doc(db, `codex_${colName}`, String(item.id))
    await setDoc(docRef, item)
  }

  const remove = async (id) => {
    await deleteDoc(doc(db, `codex_${colName}`, String(id)))
  }

  return { data, loading, synced, save, remove }
}

export function fmtDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function fmtNum(n) {
  return Math.round(n).toLocaleString('es-AR')
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
}
