import { useState } from 'react'
import { db } from './firebase'
import Selector from './pages/Selector'
import PinScreen from './pages/PinScreen'
import AdminPanel from './pages/AdminPanel'
import FumigadorMode from './pages/FumigadorMode'

export default function App() {
  const [screen, setScreen] = useState('selector') // selector | pin | admin | fumigador

  const goTo = (s) => setScreen(s)

  if (screen === 'selector') return <Selector onAdmin={() => goTo('pin')} onFumigador={() => goTo('fumigador')} />
  if (screen === 'pin') return <PinScreen onSuccess={() => goTo('admin')} onBack={() => goTo('selector')} />
  if (screen === 'admin') return <AdminPanel db={db} onExit={() => goTo('selector')} />
  if (screen === 'fumigador') return <FumigadorMode db={db} onExit={() => goTo('selector')} />
}
