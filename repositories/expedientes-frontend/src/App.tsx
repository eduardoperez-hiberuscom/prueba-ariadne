import { useState, type FormEvent } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { ExpedienteDetailPage } from './pages/ExpedienteDetailPage'
import { NewExpedientePage } from './pages/NewExpedientePage'
import type { AuthCredentials } from './types/api'

const STORAGE_KEY = 'expedientes.front.auth'

const defaultAuth: AuthCredentials = {
  username: 'admin',
  password: 'admin123',
}

function loadAuth(): AuthCredentials {
  const fromStorage = window.localStorage.getItem(STORAGE_KEY)
  if (!fromStorage) {
    return defaultAuth
  }

  try {
    return JSON.parse(fromStorage) as AuthCredentials
  } catch {
    return defaultAuth
  }
}

function saveAuth(auth: AuthCredentials): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

function App() {
  const [auth, setAuth] = useState<AuthCredentials>(() => loadAuth())
  const [draftAuth, setDraftAuth] = useState<AuthCredentials>(auth)
  const [authNotice, setAuthNotice] = useState('')

  const onConnect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuth(draftAuth)
    saveAuth(draftAuth)
    setAuthNotice('Credenciales aplicadas para las llamadas API.')
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar reveal-up">
          <div className="brand-block">
            <p className="overline">Gestor Administrativo</p>
            <Link to="/" className="brand-link">
              Expedientes 360
            </Link>
          </div>

          <nav className="main-nav" aria-label="Navegacion principal">
            <NavLink to="/" end>
              Panel
            </NavLink>
            <NavLink to="/expedientes/nuevo">Nuevo expediente</NavLink>
          </nav>

          <form className="auth-form" onSubmit={onConnect}>
            <input
              aria-label="Usuario"
              value={draftAuth.username}
              onChange={(event) =>
                setDraftAuth((prev) => ({ ...prev, username: event.target.value }))
              }
              placeholder="Usuario"
            />
            <input
              aria-label="Contrasena"
              type="password"
              value={draftAuth.password}
              onChange={(event) =>
                setDraftAuth((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Contrasena"
            />
            <button type="submit">Conectar API</button>
          </form>
        </header>

        {authNotice ? <p className="notice reveal-up">{authNotice}</p> : null}

        <main className="app-main reveal-up">
          <Routes>
            <Route path="/" element={<DashboardPage auth={auth} />} />
            <Route path="/expedientes/nuevo" element={<NewExpedientePage auth={auth} />} />
            <Route path="/expedientes/:id" element={<ExpedienteDetailPage auth={auth} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
