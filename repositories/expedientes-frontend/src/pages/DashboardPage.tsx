import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  assignExpedienteToMe,
  listExpedientes,
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
  const [allPageData, setAllPageData] = useState<PageResult<Expediente> | null>(null)
  const [assignedPageData, setAssignedPageData] = useState<PageResult<Expediente> | null>(null)
  const [unassignedPageData, setUnassignedPageData] = useState<PageResult<Expediente> | null>(null)
  const [allPage, setAllPage] = useState(0)
  const [assignedPage, setAssignedPage] = useState(0)
  const [unassignedPage, setUnassignedPage] = useState(0)
  const [activeTab, setActiveTab] = useState<'assigned' | 'search' | 'unassigned'>('assigned')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [draftFilters, setDraftFilters] = useState({
    query: '',
    fecha: '',
    fase: '',
    estado: '',
  })
  const [filters, setFilters] = useState(draftFilters)

  const sourceData =
    activeTab === 'assigned'
      ? assignedPageData?.content ?? []
      : activeTab === 'unassigned'
        ? unassignedPageData?.content ?? []
        : allPageData?.content ?? []

  const filteredData = useMemo(() => {
    return sourceData.filter((expediente) => {
      const query = filters.query.trim().toLowerCase()
      const matchesQuery =
        !query ||
        expediente.asunto.toLowerCase().includes(query) ||
          expediente.numeroExpediente.toLowerCase().includes(query) ||
          expediente.tipo.toLowerCase().includes(query)

      const dateValue = expediente.fechaCreacion?.slice(0, 10) ?? ''
      const matchesFecha = !filters.fecha || dateValue === filters.fecha

      const matchesFase =
        !filters.fase ||
        (expediente.procedimiento ?? '').toLowerCase() === filters.fase.toLowerCase()

      const matchesEstado =
        !filters.estado ||
        (expediente.estado ?? '').toLowerCase() === filters.estado.toLowerCase()

      return matchesQuery && matchesFecha && matchesFase && matchesEstado
    })
  }, [sourceData, filters])

  const faseOptions = useMemo(() => {
    return Array.from(new Set(sourceData.map((item) => item.procedimiento).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b),
    )
  }, [sourceData])

  const estadoOptions = useMemo(() => {
    return Array.from(new Set(sourceData.map((item) => item.estado).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b),
    )
  }, [sourceData])

  const currentPageData =
    activeTab === 'assigned'
      ? assignedPageData
      : activeTab === 'unassigned'
        ? unassignedPageData
        : allPageData

  const fetchAssigned = () =>
    listMyAssignedExpedientes(auth, assignedPage).then((result) => {
      setAssignedPageData(result)
    })

  const fetchUnassigned = () =>
    listUnassignedExpedientes(auth, unassignedPage).then((result) => {
      setUnassignedPageData(result)
    })

  const fetchAll = () =>
    listExpedientes(auth, allPage, 10).then((result) => {
      setAllPageData(result)
    })

  useEffect(() => {
    setIsLoading(true)
    void Promise.all([fetchAssigned(), fetchUnassigned(), fetchAll()])
      .then(() => {
        setError('')
      })
      .catch(() => {
        setError('No se pudieron cargar las bandejas. Revisa credenciales o backend.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [auth, assignedPage, unassignedPage, allPage])

  const refreshBandejas = () =>
    Promise.all([fetchAssigned(), fetchUnassigned(), fetchAll()]).then(() => {
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
    setFilters(draftFilters)
  }

  const onClearFilters = () => {
    const clean = { query: '', fecha: '', fase: '', estado: '' }
    setDraftFilters(clean)
    setFilters(clean)
  }

  const tabTitle =
    activeTab === 'assigned'
      ? 'Mis Expedientes'
      : activeTab === 'unassigned'
        ? 'Sin asignar'
        : 'Busqueda de Expedientes'

  const tabDescription =
    activeTab === 'assigned'
      ? 'Expedientes actualmente asignados a tu usuario.'
      : activeTab === 'unassigned'
        ? 'Expedientes pendientes de asignacion.'
        : 'Vista general para busqueda y revision cruzada.'

  const renderActionButtons = (expediente: Expediente) => {
    if (activeTab === 'assigned') {
      return (
        <button type="button" onClick={() => onUnassign(expediente)}>
          Desasignar
        </button>
      )
    }

    if (activeTab === 'unassigned') {
      return (
        <button type="button" onClick={() => onAssignToMe(expediente)}>
          Asignarmelo
        </button>
      )
    }

    return expediente.asignadoAId ? (
      <button type="button" onClick={() => onUnassign(expediente)}>
        Desasignar
      </button>
    ) : (
      <button type="button" onClick={() => onAssignToMe(expediente)}>
        Asignarmelo
      </button>
    )
  }

  return (
    <section className="page-grid">
      <article className="panel hero-panel">
        <p className="overline">Expedientes</p>
        <h1>{tabTitle}</h1>
        <p>{tabDescription}</p>
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
        <div className="tab-strip" role="tablist" aria-label="Bandejas de expedientes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'assigned'}
            className={activeTab === 'assigned' ? 'active' : ''}
            onClick={() => setActiveTab('assigned')}
          >
            Mis Expedientes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'search'}
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            Busqueda de Expedientes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'unassigned'}
            className={activeTab === 'unassigned' ? 'active' : ''}
            onClick={() => setActiveTab('unassigned')}
          >
            Sin asignar
          </button>
        </div>

        <form className="search-grid" onSubmit={onSearch}>
          <input
            value={draftFilters.query}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, query: event.target.value }))
            }
            placeholder="Buscar por NIF, N de Expediente..."
          />

          <input
            type="date"
            value={draftFilters.fecha}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, fecha: event.target.value }))
            }
          />

          <select
            value={draftFilters.fase}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, fase: event.target.value }))
            }
          >
            <option value="">Seleccionar fase</option>
            {faseOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={draftFilters.estado}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, estado: event.target.value }))
            }
          >
            <option value="">Seleccionar estado</option>
            {estadoOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button type="submit">Buscar</button>
          <button type="button" className="ghost-link" onClick={onClearFilters}>
            Limpiar
          </button>
        </form>

        <div className="list-header">
          <h2>Se han encontrado {filteredData.length} expedientes</h2>
          <Link className="ghost-link" to="/expedientes/nuevo">
            Nuevo expediente
          </Link>
        </div>

        {isLoading ? <p>Cargando datos...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {actionMessage ? <p className="result-ok">{actionMessage}</p> : null}

        <div className="table-wrap">
          <table className="exp-table">
            <thead>
              <tr>
                <th>Tipo Expediente</th>
                <th>N expediente</th>
                <th>Reg. Entrada</th>
                <th>Fec. Registro</th>
                <th>Fase</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Consulta</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((expediente) => (
                <tr key={expediente.id}>
                  <td>{expediente.tipo}</td>
                  <td>{expediente.numeroExpediente}</td>
                  <td>{expediente.numeroExpediente}</td>
                  <td>{formatDate(expediente.fechaCreacion)}</td>
                  <td>{expediente.procedimiento || '-'}</td>
                  <td>{expediente.asignadoAId ? auth.username : 'Sin asignar'}</td>
                  <td>{expediente.estado}</td>
                  <td>
                    <div className="table-actions">
                      {renderActionButtons(expediente)}
                      <Link className="ghost-link" to={`/expedientes/${expediente.id}`}>
                        Ver
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading &&
        filteredData.length === 0 ? (
          <p>
            {activeTab === 'assigned'
              ? 'No tienes expedientes asignados en esta pagina.'
              : activeTab === 'unassigned'
                ? 'No hay expedientes sin asignar en esta pagina.'
                : 'No hay expedientes que coincidan con la busqueda actual.'}
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

              if (activeTab === 'search') {
                setAllPage((prev) => Math.max(prev - 1, 0))
                return
              }

              setUnassignedPage((prev) => Math.max(prev - 1, 0))
            }}
            disabled={Boolean(
              activeTab === 'assigned'
                ? assignedPageData?.first
                : activeTab === 'search'
                  ? allPageData?.first
                  : unassignedPageData?.first,
            )}
          >
            Anterior
          </button>
          <span>
            Pagina{' '}
            {(currentPageData?.number ?? 0) + 1} de {currentPageData?.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'assigned') {
                setAssignedPage((prev) => prev + 1)
                return
              }

              if (activeTab === 'search') {
                setAllPage((prev) => prev + 1)
                return
              }

              setUnassignedPage((prev) => prev + 1)
            }}
            disabled={Boolean(
              activeTab === 'assigned'
                ? assignedPageData?.last
                : activeTab === 'search'
                  ? allPageData?.last
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