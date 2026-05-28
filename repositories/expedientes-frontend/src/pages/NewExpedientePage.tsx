import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createExpediente } from '../api/client'
import type { AuthCredentials } from '../types/api'

interface NewExpedientePageProps {
  auth: AuthCredentials
}

const createSchema = z.object({
  asunto: z.string().min(4, 'El asunto debe tener al menos 4 caracteres.'),
  tipo: z.string().min(2, 'Indica un tipo de expediente.'),
  descripcion: z.string().min(10, 'Incluye una descripcion mas completa.'),
  procedimiento: z.string().min(2, 'Indica el procedimiento.'),
})

export function NewExpedientePage({ auth }: NewExpedientePageProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    asunto: '',
    tipo: 'REQUERIMIENTO',
    descripcion: '',
    procedimiento: 'REQUERIMIENTO_GENERICO',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')

    const parsed = createSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulario invalido')
      return
    }

    setSubmitting(true)
    void createExpediente(auth, parsed.data)
      .then((created) => {
        setMessage(`Expediente ${created.numeroExpediente} creado correctamente.`)
        navigate(`/expedientes/${created.id}`)
      })
      .catch((caught) => {
        if (axios.isAxiosError(caught)) {
          const status = caught.response?.status
          if (status === 401) {
            setError('Backend rechazo POST con 401. Credenciales validas pero seguridad REST no permite alta (revisar CSRF/security config).')
            return
          }

          if (status === 400) {
            setError('El backend rechazo los datos enviados. Revisa asunto/tipo/procedimiento.')
            return
          }
        }

        setError('No se pudo crear el expediente. Revisa usuario/clave y datos.')
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <section className="page-grid d-grid gap-3">
      <article className="panel hero-panel card border-0 shadow-sm p-3">
        <p className="overline">Alta de expediente</p>
        <h1>Registrar nuevo caso administrativo</h1>
        <p className="text-secondary mb-0">
          Esta operacion dispara la numeracion oficial y deja trazabilidad en la
          auditoria del sistema.
        </p>
      </article>

      <article className="panel card border-0 shadow-sm p-3">
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Asunto
            <input
              className="form-control"
              value={form.asunto}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, asunto: event.target.value }))
              }
              placeholder="Requerimiento de informacion"
            />
          </label>

          <label>
            Tipo
            <input
              className="form-control"
              value={form.tipo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tipo: event.target.value }))
              }
              placeholder="REQUERIMIENTO"
            />
          </label>

          <label>
            Procedimiento
            <input
              className="form-control"
              value={form.procedimiento}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, procedimiento: event.target.value }))
              }
              placeholder="REQUERIMIENTO_GENERICO"
            />
          </label>

          <label>
            Descripcion
            <textarea
              className="form-control"
              value={form.descripcion}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, descripcion: event.target.value }))
              }
              placeholder="Contexto funcional y alcance del expediente"
            />
          </label>

          <div className="actions-row">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear expediente'}
            </button>
            <Link className="btn btn-outline-secondary" to="/">
              Volver al panel
            </Link>
          </div>
        </form>

        {message ? <div className="alert alert-success py-2 mt-3 mb-0">{message}</div> : null}
        {error ? <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div> : null}
      </article>
    </section>
  )
}