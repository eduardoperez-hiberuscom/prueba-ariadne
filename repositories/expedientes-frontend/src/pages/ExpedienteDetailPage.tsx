import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { generateDocumento, getExpedienteById } from '../api/client'
import type { AuthCredentials, Documento, Expediente } from '../types/api'

interface ExpedienteDetailPageProps {
  auth: AuthCredentials
}

function formatDate(dateTime: string | undefined): string {
  if (!dateTime) {
    return '-'
  }

  const parsed = new Date(dateTime)
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(parsed)
}

export function ExpedienteDetailPage({ auth }: ExpedienteDetailPageProps) {
  const params = useParams()
  const expedienteId = Number(params.id)
  const hasValidId = Number.isFinite(expedienteId)

  const [expediente, setExpediente] = useState<Expediente | null>(null)
  const [docResult, setDocResult] = useState<Documento | null>(null)
  const [tipoDoc, setTipoDoc] = useState('Requerimiento')
  const [contenido, setContenido] = useState('Documento generado desde front web.')
  const [error, setError] = useState('')
  const [processingDoc, setProcessingDoc] = useState(false)
  const loading = hasValidId && !expediente && !error

  useEffect(() => {
    if (!hasValidId) {
      return
    }

    void getExpedienteById(auth, expedienteId)
      .then((response) => {
        setExpediente(response)
        setError('')
      })
      .catch(() => {
        setError('No se pudo cargar el detalle del expediente.')
      })
  }, [auth, expedienteId, hasValidId])

  const onGenerateDocument = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setDocResult(null)
    setProcessingDoc(true)

    void generateDocumento(auth, {
      expedienteId,
      tipo: tipoDoc,
      variables: {
        contenido,
        fecha: new Date().toISOString(),
      },
    })
      .then((documento) => {
        setDocResult(documento)
      })
      .catch(() => {
        setError('No se pudo generar el documento para este expediente.')
      })
      .finally(() => {
        setProcessingDoc(false)
      })
  }

  return (
    <section className="page-grid d-grid gap-3">
      <article className="panel detail-panel card border-0 shadow-sm p-3">
        <div className="list-header">
          <p className="overline">Detalle de expediente</p>
          <Link className="btn btn-outline-secondary btn-sm" to="/">
            Volver al panel
          </Link>
        </div>

        {loading ? <div className="alert alert-info py-2">Cargando expediente...</div> : null}
        {!hasValidId ? (
          <div className="alert alert-danger py-2">Identificador de expediente invalido.</div>
        ) : null}
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        {expediente ? (
          <>
            <h1>{expediente.asunto}</h1>
            <p>{expediente.descripcion || 'Sin descripcion funcional'}</p>
            <div className="meta-grid">
              <div>
                <h3>Numero</h3>
                <p>{expediente.numeroExpediente}</p>
              </div>
              <div>
                <h3>Estado</h3>
                <p><span className="badge text-bg-light border">{expediente.estado}</span></p>
              </div>
              <div>
                <h3>Tipo</h3>
                <p>{expediente.tipo}</p>
              </div>
              <div>
                <h3>Procedimiento</h3>
                <p>{expediente.procedimiento}</p>
              </div>
              <div>
                <h3>Creacion</h3>
                <p>{formatDate(expediente.fechaCreacion)}</p>
              </div>
              <div>
                <h3>Actualizacion</h3>
                <p>{formatDate(expediente.fechaActualizacion)}</p>
              </div>
            </div>
          </>
        ) : null}
      </article>

      <article className="panel card border-0 shadow-sm p-3">
        <h2>Generacion de documento (RF-3)</h2>
        <form className="stack-form" onSubmit={onGenerateDocument}>
          <label>
            Tipo de documento
            <input
              className="form-control"
              value={tipoDoc}
              onChange={(event) => setTipoDoc(event.target.value)}
              placeholder="Requerimiento"
            />
          </label>

          <label>
            Variable {'{{contenido}}'}
            <textarea
              className="form-control"
              value={contenido}
              onChange={(event) => setContenido(event.target.value)}
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={processingDoc || !expediente}>
            {processingDoc ? 'Generando...' : 'Generar documento'}
          </button>
        </form>

        {docResult ? (
          <div className="result-box">
            <h3>Resultado</h3>
            <p>Estado: {docResult.estado}</p>
            <p>Version: {docResult.version ?? '-'}</p>
            <p>Ruta: {docResult.rutaArchivo ?? 'Pendiente (async)'}</p>
          </div>
        ) : null}
      </article>
    </section>
  )
}