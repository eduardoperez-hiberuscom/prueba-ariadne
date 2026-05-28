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
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onUnassign(expediente)}>
          Desasignar
        </button>
      )
    }

    if (activeTab === 'unassigned') {
      return (
        <button type="button" className="btn btn-outline-success btn-sm" onClick={() => onAssignToMe(expediente)}>
          Asignarmelo
        </button>
      )
    }

    return expediente.asignadoAId ? (
      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onUnassign(expediente)}>
        Desasignar
      </button>
    ) : (
      <button type="button" className="btn btn-outline-success btn-sm" onClick={() => onAssignToMe(expediente)}>
        Asignarmelo
      </button>
    )
  }

  return (
    <section className="page-grid d-grid gap-3">
      <article className="panel hero-panel card border-0 shadow-sm p-3">
        <p className="overline">Expedientes</p>
        <h1>{tabTitle}</h1>
        <p>{tabDescription}</p>
      </article>

      <article className="row g-3">
        <div className="col-12 col-md-4">
          <div className="panel kpi-card card border-0 shadow-sm p-3 h-100">
          <h2>Mis asignados</h2>
          <p className="kpi-value">{assignedPageData?.totalElements ?? 0}</p>
        </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="panel kpi-card card border-0 shadow-sm p-3 h-100">
          <h2>Sin asignar</h2>
          <p className="kpi-value">{unassignedPageData?.totalElements ?? 0}</p>
        </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="panel kpi-card card border-0 shadow-sm p-3 h-100">
          <h2>Total visibles</h2>
          <p className="kpi-value">
            {(assignedPageData?.content?.length ?? 0) +
              (unassignedPageData?.content?.length ?? 0)}
          </p>
        </div>
        </div>
      </article>

      <article className="panel card border-0 shadow-sm p-3">
        <div className="tab-strip nav nav-tabs" role="tablist" aria-label="Bandejas de expedientes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'assigned'}
            className={activeTab === 'assigned' ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveTab('assigned')}
          >
            Mis Expedientes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'search'}
            className={activeTab === 'search' ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveTab('search')}
          >
            Busqueda de Expedientes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'unassigned'}
            className={activeTab === 'unassigned' ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveTab('unassigned')}
          >
            Sin asignar
          </button>
        </div>

        <form className="search-grid row g-2 align-items-end" onSubmit={onSearch}>
          <div className="col-12 col-lg-3">
          <input
            className="form-control"
            value={draftFilters.query}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, query: event.target.value }))
            }
            placeholder="Buscar por NIF, N de Expediente..."
          />
          </div>

          <div className="col-12 col-lg-2">
          <input
            className="form-control"
            type="date"
            value={draftFilters.fecha}
            onChange={(event) =>
              setDraftFilters((prev) => ({ ...prev, fecha: event.target.value }))
            }
          />
          </div>

          <div className="col-12 col-lg-2">
          <select
            className="form-select"
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
          </div>

          <div className="col-12 col-lg-2">
          <select
            className="form-select"
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
          </div>

          <div className="col-6 col-lg-1 d-grid">
          <button type="submit" className="btn btn-primary">Buscar</button>
          </div>
          <div className="col-6 col-lg-1 d-grid">
          <button type="button" className="btn btn-outline-secondary" onClick={onClearFilters}>
            Limpiar
          </button>
          </div>
        </form>

        <div className="list-header">
          <h2>Se han encontrado {filteredData.length} expedientes</h2>
          <Link className="btn btn-outline-primary btn-sm" to="/expedientes/nuevo">
            Nuevo expediente
          </Link>
        </div>

        {isLoading ? <div className="alert alert-info py-2">Cargando datos...</div> : null}
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        {actionMessage ? <div className="alert alert-success py-2">{actionMessage}</div> : null}

        <div className="table-wrap table-responsive">
          <table className="exp-table table table-striped table-hover align-middle mb-0">
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
                      <Link className="btn btn-outline-primary btn-sm" to={`/expedientes/${expediente.id}`}>
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

        <div className="pager d-flex justify-content-between align-items-center gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
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
            className="btn btn-outline-primary btn-sm"
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