import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getExpedienteByNumero, listExpedientes } from '../api/client'
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
  const [pageData, setPageData] = useState<PageResult<Expediente> | null>(null)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchNumero, setSearchNumero] = useState('')
  const [searchResult, setSearchResult] = useState<Expediente | null>(null)

  useEffect(() => {
    void listExpedientes(auth, page)
      .then((result) => {
        setPageData(result)
        setError('')
      })
      .catch(() => {
        setError('No se pudo cargar el listado. Revisa credenciales o backend.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [auth, page])

  const statusSummary = useMemo(() => {
    const entries = pageData?.content ?? []
    const summary = new Map<string, number>()
    entries.forEach((item) => {
      summary.set(item.estado, (summary.get(item.estado) ?? 0) + 1)
    })
    return summary
  }, [pageData])

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
        <p className="overline">Panel operativo</p>
        <h1>Centro de control de expedientes</h1>
        <p>
          Gestiona el ciclo administrativo completo: alta, seguimiento y emision
          de documentos desde una sola interfaz.
        </p>
      </article>

      <article className="kpi-row">
        <div className="panel kpi-card">
          <h2>Total expedientes</h2>
          <p className="kpi-value">{pageData?.totalElements ?? 0}</p>
        </div>
        <div className="panel kpi-card">
          <h2>Estado INICIAL</h2>
          <p className="kpi-value">{statusSummary.get('INICIAL') ?? 0}</p>
        </div>
        <div className="panel kpi-card">
          <h2>Pagina actual</h2>
          <p className="kpi-value">{(pageData?.number ?? 0) + 1}</p>
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
          <h2>Expedientes recientes</h2>
          <Link className="ghost-link" to="/expedientes/nuevo">
            Crear nuevo
          </Link>
        </div>

        {isLoading ? <p>Cargando datos...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <div className="exp-list">
          {(pageData?.content ?? []).map((expediente) => (
            <Link
              key={expediente.id}
              className="exp-card"
              to={`/expedientes/${expediente.id}`}
            >
              <p className="overline">{expediente.numeroExpediente}</p>
              <h3>{expediente.asunto}</h3>
              <p>{expediente.descripcion || 'Sin descripcion'}</p>
              <div className="card-meta">
                <span className="pill">{expediente.estado}</span>
                <span>{formatDate(expediente.fechaCreacion)}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="pager">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setPage((prev) => Math.max(prev - 1, 0))
            }}
            disabled={Boolean(pageData?.first)}
          >
            Anterior
          </button>
          <span>
            Pagina {(pageData?.number ?? 0) + 1} de {pageData?.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setPage((prev) => prev + 1)
            }}
            disabled={Boolean(pageData?.last)}
          >
            Siguiente
          </button>
        </div>
      </article>
    </section>
  )
}