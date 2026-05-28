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
    <section className="page-grid">
      <article className="panel detail-panel">
        <div className="list-header">
          <p className="overline">Detalle de expediente</p>
          <Link className="ghost-link" to="/">
            Volver al panel
          </Link>
        </div>

        {loading ? <p>Cargando expediente...</p> : null}
        {!hasValidId ? (
          <p className="error-text">Identificador de expediente invalido.</p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}

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
                <p>{expediente.estado}</p>
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

      <article className="panel">
        <h2>Generacion de documento (RF-3)</h2>
        <form className="stack-form" onSubmit={onGenerateDocument}>
          <label>
            Tipo de documento
            <input
              value={tipoDoc}
              onChange={(event) => setTipoDoc(event.target.value)}
              placeholder="Requerimiento"
            />
          </label>

          <label>
            Variable {'{{contenido}}'}
            <textarea
              value={contenido}
              onChange={(event) => setContenido(event.target.value)}
            />
          </label>

          <button type="submit" disabled={processingDoc || !expediente}>
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