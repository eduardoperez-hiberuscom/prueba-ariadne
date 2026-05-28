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
import { NewExpedientePage } from './pages/NewExpedientePage'
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
      <div className="app-shell container-fluid py-3">
        <header className="topbar reveal-up card border-0 shadow-sm mb-3 p-3">
          <div className="brand-block">
            <p className="overline">Ariadne</p>
            <Link to="/" className="brand-link">
              Tramitador Corporativo <span className="text-secondary">v{APP_VERSION}</span>
            </Link>
          </div>

          <nav className="main-nav nav nav-pills" aria-label="Navegacion principal">
            {isAuthenticated ? (
              <>
                <NavLink to="/" end className="nav-link">
                  <i className="bi bi-grid me-1"></i>
                  Panel
                </NavLink>
                <NavLink to="/expedientes/nuevo" className="nav-link">
                  <i className="bi bi-plus-circle me-1"></i>
                  Nuevo expediente
                </NavLink>
              </>
            ) : (
              <NavLink to="/login" className="nav-link">
                Acceso
              </NavLink>
            )}
          </nav>

          {isAuthenticated ? (
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
          ) : null}
        </header>

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
                    <article className="panel login-card hero-panel card border-0 shadow-sm p-4">
                      <p className="overline">Acceso seguro</p>
                      <h1>Inicia sesion para usar Expedientes 360</h1>
                      <p className="mb-0">
                        El panel y las operaciones de alta quedan protegidos hasta
                        validar credenciales contra la API.
                      </p>

                      <form className="stack-form" onSubmit={onConnect}>
                        <label>
                          Usuario
                          <input
                            className="form-control"
                            aria-label="Usuario"
                            value={draftAuth.username}
                            onChange={(event) =>
                              setDraftAuth((prev) => ({
                                ...prev,
                                username: event.target.value,
                              }))
                            }
                            placeholder="admin"
                          />
                        </label>

                        <label>
                          Contrasena
                          <input
                            className="form-control"
                            aria-label="Contrasena"
                            type="password"
                            value={draftAuth.password}
                            onChange={(event) =>
                              setDraftAuth((prev) => ({
                                ...prev,
                                password: event.target.value,
                              }))
                            }
                            placeholder="Tu clave"
                          />
                        </label>

                        <button type="submit" className="btn btn-primary" disabled={isSigningIn}>
                          {isSigningIn ? 'Validando...' : 'Entrar'}
                        </button>
                      </form>

                      {authError ? <p className="error-text">{authError}</p> : null}
                    </article>
                  </section>
                )
              }
            />

            <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              <Route path="/" element={auth ? <DashboardPage auth={auth} /> : null} />
              <Route
                path="/expedientes/nuevo"
                element={auth ? <NewExpedientePage auth={auth} /> : null}
              />
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
