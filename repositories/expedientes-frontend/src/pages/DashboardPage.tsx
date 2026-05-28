import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  assignExpedienteToMe,
  getExpedienteByNumero,
  listMyAssignedExpedientes,
  listUnassignedExpedientes,
  unassignExpedienteFromMe,
} from '../api/client'
import type { AuthCredentials, Expediente, PageResult } from '../types/api'

interface DashboardPageProps {
  auth: AuthCredentials
}

function formatDate(dateTime: string | undefined): string {
  if (!dateTime) {
    return '-'
  }

  const parsed = new Date(dateTime)
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

export function DashboardPage({ auth }: DashboardPageProps) {
  const [assignedPageData, setAssignedPageData] = useState<PageResult<Expediente> | null>(null)
  const [unassignedPageData, setUnassignedPageData] = useState<PageResult<Expediente> | null>(null)
  const [assignedPage, setAssignedPage] = useState(0)
  const [unassignedPage, setUnassignedPage] = useState(0)
  const [activeTab, setActiveTab] = useState<'assigned' | 'unassigned'>('assigned')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [searchNumero, setSearchNumero] = useState('')
  const [searchResult, setSearchResult] = useState<Expediente | null>(null)

  const fetchAssigned = () =>
    listMyAssignedExpedientes(auth, assignedPage).then((result) => {
      setAssignedPageData(result)
    })

  const fetchUnassigned = () =>
    listUnassignedExpedientes(auth, unassignedPage).then((result) => {
      setUnassignedPageData(result)
    })

  useEffect(() => {
    setIsLoading(true)
    void Promise.all([fetchAssigned(), fetchUnassigned()])
      .then(() => {
        setError('')
      })
      .catch(() => {
        setError('No se pudieron cargar las bandejas. Revisa credenciales o backend.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [auth, assignedPage, unassignedPage])

  const refreshBandejas = () =>
    Promise.all([fetchAssigned(), fetchUnassigned()]).then(() => {
      setError('')
    })

  const onAssignToMe = (expediente: Expediente) => {
    setActionMessage('')
    setError('')
    setIsLoading(true)

    void assignExpedienteToMe(auth, expediente.id)
      .then(() => refreshBandejas())
      .then(() => {
        setActionMessage(`Expediente ${expediente.numeroExpediente} asignado correctamente.`)
      })
      .catch(() => {
        setError('No se pudo asignar el expediente.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const onUnassign = (expediente: Expediente) => {
    setActionMessage('')
    setError('')
    setIsLoading(true)

    void unassignExpedienteFromMe(auth, expediente.id)
      .then(() => refreshBandejas())
      .then(() => {
        setActionMessage(`Expediente ${expediente.numeroExpediente} desasignado correctamente.`)
      })
      .catch(() => {
        setError('No se pudo desasignar el expediente.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchResult(null)
    setError('')

    if (!searchNumero.trim()) {
      return
    }

    setIsLoading(true)
    void getExpedienteByNumero(auth, searchNumero.trim())
      .then((result) => {
        setSearchResult(result)
      })
      .catch(() => {
        setError('No existe un expediente con ese numero.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <section className="page-grid">
      <article className="panel hero-panel">
        <p className="overline">Panel principal</p>
        <h1>Bandeja de expedientes</h1>
        <p>
          Muevete entre tus expedientes asignados y los pendientes de asignacion.
          Puedes autoasignarte o liberar asignaciones directamente desde aqui.
        </p>
      </article>

      <article className="kpi-row">
        <div className="panel kpi-card">
          <h2>Mis asignados</h2>
          <p className="kpi-value">{assignedPageData?.totalElements ?? 0}</p>
        </div>
        <div className="panel kpi-card">
          <h2>Sin asignar</h2>
          <p className="kpi-value">{unassignedPageData?.totalElements ?? 0}</p>
        </div>
        <div className="panel kpi-card">
          <h2>Total visibles</h2>
          <p className="kpi-value">
            {(assignedPageData?.content?.length ?? 0) +
              (unassignedPageData?.content?.length ?? 0)}
          </p>
        </div>
      </article>

      <article className="panel">
        <h2>Busqueda rapida por numero</h2>
        <form className="inline-form" onSubmit={onSearch}>
          <input
            value={searchNumero}
            onChange={(event) => setSearchNumero(event.target.value)}
            placeholder="Ejemplo: 20260521-12345"
          />
          <button type="submit">Buscar</button>
        </form>

        {searchResult ? (
          <p className="result-ok">
            Encontrado: <strong>{searchResult.asunto}</strong>.
            <Link to={`/expedientes/${searchResult.id}`}> Abrir detalle</Link>
          </p>
        ) : null}
      </article>

      <article className="panel">
        <div className="list-header">
          <h2>Gestion de asignaciones</h2>
          <Link className="ghost-link" to="/expedientes/nuevo">
            Crear nuevo
          </Link>
        </div>

        <div className="actions-row">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            disabled={activeTab === 'assigned'}
          >
            Mis asignados
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unassigned')}
            disabled={activeTab === 'unassigned'}
          >
            Sin asignar
          </button>
        </div>

        {isLoading ? <p>Cargando datos...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {actionMessage ? <p className="result-ok">{actionMessage}</p> : null}

        <div className="exp-list">
          {(activeTab === 'assigned'
            ? assignedPageData?.content ?? []
            : unassignedPageData?.content ?? []
          ).map((expediente) => (
            <article key={expediente.id} className="exp-card">
              <p className="overline">{expediente.numeroExpediente}</p>
              <h3>
                <Link to={`/expedientes/${expediente.id}`}>{expediente.asunto}</Link>
              </h3>
              <p>{expediente.descripcion || 'Sin descripcion'}</p>
              <div className="card-meta">
                <span className="pill">{expediente.estado}</span>
                <span>{formatDate(expediente.fechaCreacion)}</span>
              </div>

              <div className="actions-row">
                {activeTab === 'unassigned' ? (
                  <button type="button" onClick={() => onAssignToMe(expediente)}>
                    Asignarmelo
                  </button>
                ) : (
                  <button type="button" onClick={() => onUnassign(expediente)}>
                    Desasignar
                  </button>
                )}

                <Link className="ghost-link" to={`/expedientes/${expediente.id}`}>
                  Abrir
                </Link>
              </div>
            </article>
          ))}
        </div>

        {!isLoading &&
        (activeTab === 'assigned'
          ? (assignedPageData?.content ?? []).length === 0
          : (unassignedPageData?.content ?? []).length === 0) ? (
          <p>
            {activeTab === 'assigned'
              ? 'No tienes expedientes asignados en esta pagina.'
              : 'No hay expedientes sin asignar en esta pagina.'}
          </p>
        ) : null}

        <div className="pager">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'assigned') {
                setAssignedPage((prev) => Math.max(prev - 1, 0))
                return
              }

              setUnassignedPage((prev) => Math.max(prev - 1, 0))
            }}
            disabled={Boolean(
              activeTab === 'assigned'
                ? assignedPageData?.first
                : unassignedPageData?.first,
            )}
          >
            Anterior
          </button>
          <span>
            Pagina{' '}
            {(activeTab === 'assigned'
              ? assignedPageData?.number ?? 0
              : unassignedPageData?.number ?? 0) + 1}{' '}
            de {activeTab === 'assigned' ? assignedPageData?.totalPages ?? 1 : unassignedPageData?.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'assigned') {
                setAssignedPage((prev) => prev + 1)
                return
              }

              setUnassignedPage((prev) => prev + 1)
            }}
            disabled={Boolean(
              activeTab === 'assigned'
                ? assignedPageData?.last
                : unassignedPageData?.last,
            )}
          >
            Siguiente
          </button>
        </div>
      </article>
    </section>
  )
}