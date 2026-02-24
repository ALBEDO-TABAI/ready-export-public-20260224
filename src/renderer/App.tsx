import { Routes, Route } from 'react-router-dom'
import WorkbenchMode from './pages/WorkbenchMode'
import ReadyMode from './pages/ReadyMode'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <Routes>
        <Route path="/" element={<WorkbenchMode />} />
        <Route path="/ready" element={<ReadyMode />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default App
