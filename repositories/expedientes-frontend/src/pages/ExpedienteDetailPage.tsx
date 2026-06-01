import { useEffect, useRef, useState, type FormEvent } from 'react'
import { jsPDF } from 'jspdf'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  advanceExpedienteToEsperaPortafirmas,
  clearResolutionDocuments,
  completeAdministrativeReview,
  generateDocumento,
  generateResolutionDocument,
  getExpedienteById,
  listPlantillasRespuesta,
  listResolutionDocuments,
  rollbackExpedientePhase,
} from '../api/client'
import type {
  AuthCredentials,
  Documento,
  Expediente,
  PlantillaRespuesta,
  ReviewAdministrativaPayload,
} from '../types/api'

interface ExpedienteDetailPageProps {
  auth: AuthCredentials
}

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

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

function formatWorkflowLabel(value: string | undefined): string {
  if (!value) {
    return '-'
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function ExpedienteDetailPage({ auth }: ExpedienteDetailPageProps) {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const expedienteId = Number(params.id)
  const hasValidId = Number.isFinite(expedienteId)
  const isTramitarMode = searchParams.get('mode') === 'tramitar'

  const [expediente, setExpediente] = useState<Expediente | null>(null)
  const [docResult, setDocResult] = useState<Documento | null>(null)
  const [tipoDoc, setTipoDoc] = useState('Requerimiento')
  const [contenido, setContenido] = useState('Documento generado desde front web.')
  const [plantillasRespuesta, setPlantillasRespuesta] = useState<PlantillaRespuesta[]>([])
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<string>('')
  const [respuestaContenido, setRespuestaContenido] = useState('')
  const [documentosGenerados, setDocumentosGenerados] = useState<Documento[]>([])
  const [selectedDocumentPreview, setSelectedDocumentPreview] = useState<Documento | null>(null)
  const [selectedDocumentPdfBlob, setSelectedDocumentPdfBlob] = useState<Blob | null>(null)
  const [previewError, setPreviewError] = useState('')
  const previewCanvasContainerRef = useRef<HTMLDivElement | null>(null)
  const [reviewForm, setReviewForm] = useState<ReviewAdministrativaPayload>({
    asunto: '',
    tipo: '',
    procedimiento: '',
    descripcion: '',
  })
  const [error, setError] = useState('')
  const [processingDoc, setProcessingDoc] = useState(false)
  const [clearingDocs, setClearingDocs] = useState(false)
  const [movingPhase, setMovingPhase] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const loading = hasValidId && !expediente && !error
  const canTramitar = isTramitarMode && expediente?.fase === 'REVISION_ADMINISTRATIVA'
  const isGenerarResolucionPhase = expediente?.fase === 'GENERAR_RESOLUCION'
  const hasGeneratedDocuments = documentosGenerados.length > 0
  const canSubmitTramitacion = documentosGenerados.length >= 1

  useEffect(() => {
    if (!hasValidId) {
      return
    }

    void getExpedienteById(auth, expedienteId)
      .then((response) => {
        setExpediente(response)
        setReviewForm({
          asunto: response.asunto ?? '',
          tipo: response.tipo ?? '',
          procedimiento: response.procedimiento ?? '',
          descripcion: response.descripcion ?? '',
        })
        setError('')

        if (response.fase === 'GENERAR_RESOLUCION') {
          return Promise.all([
            listPlantillasRespuesta(auth),
            listResolutionDocuments(auth, response.id),
          ]).then(([plantillas, documentos]) => {
            setPlantillasRespuesta(plantillas)
            setDocumentosGenerados(documentos)
            setSelectedPlantillaId('')
            setRespuestaContenido('')
          })
        }

        setPlantillasRespuesta([])
        setSelectedPlantillaId('')
        setRespuestaContenido('')
        setDocumentosGenerados([])
        return Promise.resolve()
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

  const onPlantillaChange = (nextId: string) => {
    setSelectedPlantillaId(nextId)
    const selected = plantillasRespuesta.find((item) => String(item.id) === nextId)
    setRespuestaContenido(selected?.contenido ?? '')
  }

  const onGenerateResolutionDocument = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!expediente || !selectedPlantillaId) {
      setError('Selecciona una plantilla de respuesta para generar el documento.')
      return
    }

    setError('')
    setDocResult(null)
    setProcessingDoc(true)

    void generateResolutionDocument(auth, expediente.id, {
      plantillaRespuestaId: Number(selectedPlantillaId),
      textoRespuestaResolucion: respuestaContenido,
    })
      .then((documento) => {
        setDocResult(documento)
        return listResolutionDocuments(auth, expediente.id)
      })
      .then((documentos) => {
        setDocumentosGenerados(documentos)
      })
      .catch(() => {
        setError('No se pudo generar la resolucion con la plantilla seleccionada.')
      })
      .finally(() => {
        setProcessingDoc(false)
      })
  }

  const buildDocumentPdf = (documento: Documento): jsPDF => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const marginX = 15
    const startY = 20
    const lineHeight = 7
    const maxWidth = 180
    const pageHeight = 297
    const bottomMargin = 15

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    const contenidoDoc = (documento.contenido ?? '').trim()
    const contenido = contenidoDoc.length > 0
      ? contenidoDoc
      : 'Sin contenido disponible'

    const lines = doc.splitTextToSize(contenido, maxWidth)
    let currentY = startY

    lines.forEach((line: string) => {
      if (currentY + lineHeight > pageHeight - bottomMargin) {
        doc.addPage()
        currentY = startY
      }
      doc.text(line, marginX, currentY)
      currentY += lineHeight
    })

    return doc
  }

  const closePreview = () => {
    setSelectedDocumentPreview(null)
    setSelectedDocumentPdfBlob(null)
    setPreviewError('')
  }

  const onPreviewDocument = (documento: Documento) => {
    const pdfBlob = buildDocumentPdf(documento).output('blob')
    setSelectedDocumentPdfBlob(pdfBlob)
    setSelectedDocumentPreview(documento)
  }

  const onDownloadDocument = (documento: Documento) => {
    const blob = buildDocumentPdf(documento).output('blob')
    const url = window.URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `resolucion-${documento.expedienteId}-v${documento.version ?? 1}.pdf`
    window.document.body.appendChild(anchor)
    anchor.click()
    window.document.body.removeChild(anchor)
    window.URL.revokeObjectURL(url)
  }

  const onClearResolutionDocuments = () => {
    if (!expediente || clearingDocs) {
      return
    }

    setError('')
    setClearingDocs(true)

    void clearResolutionDocuments(auth, expediente.id)
      .then(() => {
        setDocumentosGenerados([])
        setDocResult(null)
        closePreview()
      })
      .catch(() => {
        setError('No se pudieron limpiar los documentos generados.')
      })
      .finally(() => {
        setClearingDocs(false)
      })
  }

  const onAdvanceToEsperaPortafirmas = () => {
    if (!expediente || movingPhase) {
      return
    }

    setError('')
    setMovingPhase(true)

    void advanceExpedienteToEsperaPortafirmas(auth, expediente.id)
      .then(() => {
        navigate('/?tab=assigned', { replace: true })
      })
      .catch(() => {
        setError('No se pudo avanzar el expediente a espera de portafirmas.')
      })
      .finally(() => {
        setMovingPhase(false)
      })
  }

  const onCancelToRevisionAdministrativa = () => {
    if (!expediente || movingPhase) {
      return
    }

    setError('')
    setMovingPhase(true)

    void rollbackExpedientePhase(auth, expediente.id)
      .then(() => {
        navigate('/?tab=assigned', { replace: true })
      })
      .catch(() => {
        setError('No se pudo cancelar y volver a revision administrativa.')
      })
      .finally(() => {
        setMovingPhase(false)
      })
  }

  useEffect(() => {
    if (!selectedDocumentPdfBlob || !selectedDocumentPreview) {
      return
    }

    const container = previewCanvasContainerRef.current
    if (!container) {
      return
    }

    let cancelled = false

    const renderPreview = async () => {
      setPreviewError('')
      container.innerHTML = ''

      try {
        const arrayBuffer = await selectedDocumentPdfBlob.arrayBuffer()
        const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) })
        const pdf = await loadingTask.promise

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) {
            return
          }

          const page = await pdf.getPage(pageNumber)
          const viewport = page.getViewport({ scale: 1.25 })
          const canvas = document.createElement('canvas')
          canvas.className = 'doc-preview-canvas'
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)

          const context = canvas.getContext('2d')
          if (!context) {
            throw new Error('No se pudo inicializar el lienzo de previsualizacion')
          }

          await page.render({ canvas, canvasContext: context, viewport }).promise

          if (cancelled) {
            return
          }

          container.appendChild(canvas)
        }
      } catch (previewException) {
        console.error('Error renderizando PDF en vista previa', previewException)
        if (!cancelled) {
          setPreviewError('No se pudo renderizar el PDF en la vista previa.')
        }
      }
    }

    void renderPreview()

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [selectedDocumentPdfBlob, selectedDocumentPreview])

  const onSubmitAdministrativeReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!expediente) {
      return
    }

    setError('')
    setIsSubmittingReview(true)

    void completeAdministrativeReview(auth, expediente.id, reviewForm)
      .then(() => {
        navigate('/', {
          replace: true,
        })
      })
      .catch(() => {
        setError('No se pudo completar la revision administrativa del expediente.')
      })
      .finally(() => {
        setIsSubmittingReview(false)
      })
  }

  return (
    <section className="page-grid d-grid gap-3">
      <article className="panel detail-panel card border-0 shadow-sm p-3">
        <div className="detail-topbar">
          <div>
            <p className="overline">
              {isTramitarMode ? 'Tramitacion de expediente' : 'Detalle de expediente'}
            </p>
            <h1 className="detail-title mb-1">{expediente?.asunto ?? 'Expediente'}</h1>
            <p className="detail-subtitle">
              {expediente?.descripcion || 'Sin descripcion funcional'}
            </p>
          </div>
          <div className="detail-topbar-actions">
            <span className="badge rounded-pill text-bg-light border px-3 py-2">
              {formatWorkflowLabel(expediente?.fase)}
            </span>
            <Link className="btn btn-primary btn-sm" to="/">
              Volver al panel
            </Link>
          </div>
        </div>

        {loading ? <div className="alert alert-info py-2">Cargando expediente...</div> : null}
        {!hasValidId ? (
          <div className="alert alert-danger py-2">Identificador de expediente invalido.</div>
        ) : null}
        {error ? <div className="alert alert-danger py-2">{error}</div> : null}

        {expediente ? (
          <>
            <div className="meta-grid detail-meta-grid">
              <div className="meta-item">
                <h3>Numero</h3>
                <p>{expediente.numeroExpediente}</p>
              </div>
              <div className="meta-item">
                <h3>Estado</h3>
                <p><span className="badge text-bg-light border">{expediente.estado}</span></p>
              </div>
              <div className="meta-item">
                <h3>Fase</h3>
                <p>{formatWorkflowLabel(expediente.fase)}</p>
              </div>
              <div className="meta-item">
                <h3>Tipo</h3>
                <p>{expediente.tipo}</p>
              </div>
              <div className="meta-item">
                <h3>Procedimiento</h3>
                <p>{expediente.procedimiento}</p>
              </div>
              <div className="meta-item">
                <h3>Creacion</h3>
                <p>{formatDate(expediente.fechaCreacion)}</p>
              </div>
              <div className="meta-item">
                <h3>Actualizacion</h3>
                <p>{formatDate(expediente.fechaActualizacion)}</p>
              </div>
            </div>
          </>
        ) : null}
      </article>

      {isGenerarResolucionPhase ? (
        <article className="panel card border-0 shadow-sm p-3 resolution-panel reveal-up">
          <div className="resolution-header mb-3">
            <div>
              <h2 className="mb-1">Generar Resolucion</h2>
              <p className="text-secondary mb-0">
                Selecciona plantilla, ajusta el contenido y valida antes de tramitar.
              </p>
            </div>
            <div className="resolution-kpis">
              <span className="resolution-pill">
                {hasGeneratedDocuments
                  ? `${documentosGenerados.length} documento${documentosGenerados.length > 1 ? 's' : ''}`
                  : 'Sin documentos'}
              </span>
              <span className="badge rounded-pill text-bg-light border px-3 py-2">
                {formatWorkflowLabel(expediente?.fase)}
              </span>
            </div>
          </div>

          <div className="resolution-layout">
            <section className="resolution-compose">
              <form className="stack-form" onSubmit={onGenerateResolutionDocument}>
                <label>
                  Plantilla de respuesta
                  <select
                    className={selectedPlantillaId ? 'form-select' : 'form-select filter-placeholder'}
                    value={selectedPlantillaId}
                    onChange={(event) => onPlantillaChange(event.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {plantillasRespuesta.map((plantilla) => (
                      <option key={plantilla.id} value={plantilla.id}>
                        {plantilla.titulo}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Contenido de la respuesta
                  <textarea
                    className="form-control"
                    rows={16}
                    value={respuestaContenido}
                    onChange={(event) => setRespuestaContenido(event.target.value)}
                    placeholder="Selecciona primero una plantilla de respuesta"
                    disabled={!selectedPlantillaId}
                  />
                </label>

                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-aepd-orange" type="submit" disabled={processingDoc || !selectedPlantillaId}>
                    {processingDoc ? 'Generando documento...' : 'Generar documento'}
                  </button>
                </div>
              </form>

              {docResult ? (
                <div className="result-box mt-3">
                  <h3>Documento generado</h3>
                  <p>Estado: {docResult.estado}</p>
                  <p>Version: {docResult.version ?? '-'}</p>
                  <p>Plantilla base: {docResult.plantillaCodigo ?? '-'}</p>
                  <p>Plantilla respuesta: {docResult.plantillaRespuestaCodigo ?? '-'}</p>
                </div>
              ) : null}
            </section>

            <aside className="generated-docs resolution-history">
              <div className="list-header mb-2">
                <h3>Documentos generados</h3>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={onClearResolutionDocuments}
                  disabled={clearingDocs || !hasGeneratedDocuments}
                >
                  {clearingDocs ? 'Limpiando...' : 'Limpiar documentos'}
                </button>
              </div>
              {documentosGenerados.length === 0 ? (
                <p className="text-secondary mb-0">Todavia no hay documentos generados en esta fase.</p>
              ) : (
                <div className="generated-docs-list">
                  {documentosGenerados.map((documento) => (
                    <article
                      key={documento.id}
                      className={`generated-doc-item ${selectedDocumentPreview?.id === documento.id ? 'is-selected' : ''}`}
                    >
                      <div>
                        <p className="mb-1 fw-semibold">
                          Resolucion DPD v{documento.version ?? 1}
                        </p>
                        <p className="mb-0 text-secondary">
                          Estado: {documento.estado} · Plantilla: {documento.plantillaRespuestaCodigo ?? '-'}
                        </p>
                      </div>
                      <div className="generated-doc-actions">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm icon-action-btn"
                          onClick={() => onPreviewDocument(documento)}
                          title="Visualizar documento"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm icon-action-btn"
                          onClick={() => onDownloadDocument(documento)}
                          title="Descargar documento"
                        >
                          <i className="bi bi-download"></i>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>

          <div className="phase-actions-bar d-flex justify-content-center align-items-center gap-2 flex-wrap mt-3">
            <button
              type="button"
              className="btn btn-aepd-orange"
              onClick={onAdvanceToEsperaPortafirmas}
              disabled={movingPhase || !canSubmitTramitacion}
            >
              {movingPhase ? 'Procesando...' : 'Tramitar'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancelToRevisionAdministrativa}
              disabled={movingPhase}
            >
              Cancelar
            </button>
          </div>
        </article>
      ) : isTramitarMode ? (
        <article className="panel card border-0 shadow-sm p-3 reveal-up">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
            <div>
              <h2 className="mb-1">Revision administrativa</h2>
              <p className="text-secondary mb-0">
                Corrige o completa los datos y, cuando todo este validado, avanza el expediente a generar resolucion.
              </p>
            </div>
            <span className="badge rounded-pill text-bg-light border px-3 py-2">
              {formatWorkflowLabel(expediente?.fase)}
            </span>
          </div>

          {!canTramitar ? (
            <div className="alert alert-warning py-2 mb-0">
              Este expediente ya no esta en revision administrativa o no puede tramitarse desde esta vista.
            </div>
          ) : (
            <form className="stack-form" onSubmit={onSubmitAdministrativeReview}>
              <label>
                Asunto
                <input
                  className="form-control"
                  value={reviewForm.asunto}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, asunto: event.target.value }))
                  }
                  placeholder="Asunto del expediente"
                />
              </label>

              <label>
                Tipo de expediente
                <input
                  className="form-control"
                  value={reviewForm.tipo}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, tipo: event.target.value }))
                  }
                  placeholder="REQUERIMIENTO"
                />
              </label>

              <label>
                Procedimiento
                <input
                  className="form-control"
                  value={reviewForm.procedimiento}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, procedimiento: event.target.value }))
                  }
                  placeholder="Procedimiento administrativo"
                />
              </label>

              <label>
                Descripcion
                <textarea
                  className="form-control"
                  rows={5}
                  value={reviewForm.descripcion}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, descripcion: event.target.value }))
                  }
                  placeholder="Describe el expediente o anade observaciones"
                />
              </label>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-aepd-orange"
                  type="submit"
                  disabled={isSubmittingReview || !expediente}
                >
                  {isSubmittingReview ? 'Generando resolucion...' : 'Generar resolucion'}
                </button>
                <Link className="btn btn-outline-secondary" to="/">
                  Cancelar
                </Link>
              </div>
            </form>
          )}
        </article>
      ) : (
        <article className="panel card border-0 shadow-sm p-3 reveal-up">
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
      )}
      {selectedDocumentPreview ? (
        <div
          className="assignment-modal-backdrop"
          role="presentation"
          onClick={closePreview}
        >
          <article
            className="assignment-modal card border-0 shadow-lg doc-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="assignment-modal-header">
              <div>
                <p className="overline">Visualizacion</p>
                <h2 id="doc-preview-title">Resolucion generada</h2>
                <p className="mb-0">Version {selectedDocumentPreview.version ?? 1}</p>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm icon-action-btn"
                onClick={closePreview}
                aria-label="Cerrar visualizacion de documento"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="doc-preview-body">
              {previewError ? (
                <div>
                  <p className="mb-2 text-secondary">{previewError}</p>
                  <pre>{selectedDocumentPreview.contenido ?? 'Sin contenido disponible'}</pre>
                </div>
              ) : selectedDocumentPdfBlob ? (
                <div className="doc-preview-pdf-pages" ref={previewCanvasContainerRef} />
              ) : (
                <p className="mb-0">No se pudo generar la previsualizacion PDF.</p>
              )}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}