import { useState, type FormEvent } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'
import { listExpedientes } from './api/client'
import { DashboardPage } from './pages/DashboardPage'
import { ExpedienteDetailPage } from './pages/ExpedienteDetailPage'
import type { AuthCredentials } from './types/api'

const AUTH_STORAGE_KEY = 'expedientes.front.auth'
const SESSION_STORAGE_KEY = 'expedientes.front.session'
const APP_VERSION = '3.18.0-SNAPSHOT'

const emptyAuth: AuthCredentials = {
  username: '',
  password: '',
}

function loadAuth(): AuthCredentials | null {
  const fromStorage = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!fromStorage) {
    return null
  }

  try {
    return JSON.parse(fromStorage) as AuthCredentials
  } catch {
    return null
  }
}

function saveAuth(auth: AuthCredentials): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

function hasSession(): boolean {
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === '1'
}

function setSession(active: boolean): void {
  if (active) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, '1')
    return
  }

  window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

function ProtectedRoute({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  const storedAuth = loadAuth()
  const [auth, setAuth] = useState<AuthCredentials | null>(() =>
    hasSession() ? storedAuth : null,
  )
  const [draftAuth, setDraftAuth] = useState<AuthCredentials>(
    storedAuth ?? emptyAuth,
  )
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')

  const onConnect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draftAuth.username.trim() || !draftAuth.password.trim()) {
      setAuthError('Introduce usuario y contrasena para continuar.')
      setAuthNotice('')
      return
    }

    setIsSigningIn(true)
    setAuthError('')
    setAuthNotice('')

    const nextAuth = {
      username: draftAuth.username.trim(),
      password: draftAuth.password,
    }

    void listExpedientes(nextAuth, 0, 1)
      .then(() => {
        setAuth(nextAuth)
        saveAuth(nextAuth)
        setSession(true)
        setAuthNotice('')
      })
      .catch(() => {
        setAuthError('No se pudo iniciar sesion. Revisa usuario/clave.')
      })
      .finally(() => {
        setIsSigningIn(false)
      })
  }

  const onLogout = () => {
    setSession(false)
    setAuth(null)
    setAuthNotice('Sesion cerrada.')
    setAuthError('')
  }

  const isAuthenticated = Boolean(auth)

  return (
    <BrowserRouter>
      <div className={`app-shell container-fluid py-3 ${isAuthenticated ? '' : 'login-shell'}`}>
        {isAuthenticated ? (
          <header className="topbar reveal-up card border-0 shadow-sm mb-3 p-3">
            <div className="brand-block">
              <p className="overline">Ariadne</p>
              <Link to="/" className="brand-link">
                Tramitador Corporativo <span className="app-version">v{APP_VERSION}</span>
              </Link>
            </div>

            <nav className="main-nav nav nav-pills" aria-label="Navegacion principal">
              <>
                <NavLink to="/" end className="nav-link">
                  <i className="bi bi-grid me-1"></i>
                  Panel
                </NavLink>
                <NavLink to="/?nuevo=1" className="nav-link">
                  <i className="bi bi-plus-circle me-1"></i>
                  Nuevo expediente
                </NavLink>
              </>
            </nav>

            <div className="topbar-auth">
              <p className="user-chip">
                <i className="bi bi-person-circle me-1"></i>
                Sesion activa: {auth?.username}
              </p>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Cerrar sesion
              </button>
            </div>
          </header>
        ) : null}

        {authNotice ? <p className="notice reveal-up">{authNotice}</p> : null}

        <main className="app-main reveal-up">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <section className="login-layout container-fluid">
                    <article className="login-classic-card card border-0 shadow-sm">
                      <div className="login-classic-brand">
                        <span className="login-classic-logo-mark">ARIADNE</span>
                        <span className="login-classic-logo-text">tramitador corporativo</span>
                      </div>

                      <p className="login-classic-subtitle">
                        Acceso seguro al panel de gestion de expedientes.
                      </p>

                      <form className="login-classic-form" onSubmit={onConnect}>
                        <div className="login-classic-row">
                          <label htmlFor="login-usuario">Usuario:</label>
                          <input
                            id="login-usuario"
                            className="form-control"
                            aria-label="Usuario"
                            placeholder="Introduce tu usuario"
                            autoComplete="username"
                            value={draftAuth.username}
                            onChange={(event) =>
                              setDraftAuth((prev) => ({
                                ...prev,
                                username: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="login-classic-row">
                          <label htmlFor="login-clave">Clave:</label>
                          <input
                            id="login-clave"
                            className="form-control"
                            aria-label="Contrasena"
                            type="password"
                            placeholder="Introduce tu clave"
                            autoComplete="current-password"
                            value={draftAuth.password}
                            onChange={(event) =>
                              setDraftAuth((prev) => ({
                                ...prev,
                                password: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="login-classic-actions">
                          <button type="submit" className="btn btn-aepd-orange btn-sm login-submit-btn" disabled={isSigningIn}>
                            {isSigningIn ? 'Validando...' : 'Iniciar sesion'}
                          </button>
                        </div>
                      </form>

                      {authError ? <p className="error-text mt-2">{authError}</p> : null}
                    </article>
                  </section>
                )
              }
            />

            <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              <Route path="/" element={auth ? <DashboardPage auth={auth} /> : null} />
              <Route
                path="/expedientes/:id"
                element={auth ? <ExpedienteDetailPage auth={auth} /> : null}
              />
            </Route>

            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
