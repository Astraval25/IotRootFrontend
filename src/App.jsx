import { useEffect } from 'react'
import { AppRouter } from './app/AppRouter'
import { hydrateSessionIfNeeded } from './features/auth/api/authApi'

function App() {
  useEffect(() => {
    hydrateSessionIfNeeded()
  }, [])

  return <AppRouter />
}

export default App
