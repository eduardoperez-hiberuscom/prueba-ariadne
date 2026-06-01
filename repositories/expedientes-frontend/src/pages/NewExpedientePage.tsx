import { useEffect, useMemo, useState, type FormEvent } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { assignExpedienteToMe, createExpediente } from '../api/client'
import type { AuthCredentials, Expediente } from '../types/api'

interface NewExpedientePageProps {
  auth: AuthCredentials
  onClose?: () => void
  onCreated?: (expediente: Expediente) => void
}

const createSchema = z.object({
  asunto: z.string().min(2, 'No se pudo generar el asunto.'),
  tipo: z.string().min(2, 'Indica un tipo de expediente.'),
  descripcion: z.string().min(2, 'No se pudo generar la descripcion.'),
  procedimiento: z.string().min(2, 'Indica el procedimiento.'),
})

type ExpedienteTypeKey =
  | 'brecha-seguridad'
  | 'consultas'
  | 'consultas-previas'
  | 'sugerencias-quejas'
  | 'delegado-proteccion-datos'

type OperationModeKey = 'peticion-interesado' | 'de-oficio'
type NotificationChannelKey = 'correo-electronico' | 'correo-postal'
type PersonTypeKey = 'persona-fisica' | 'persona-juridica'

interface PartyData {
  naturalezaJuridica: '' | PersonTypeKey
  tipoDocumento: string
  numeroDocumento: string
  nombre: string
  primerApellido: string
  segundoApellido: string
  medioNotificacion: '' | NotificationChannelKey
  correoElectronico: string
  direccionPostal: string
  telefono: string
}

interface ConsultaData {
  titulo: string
  consulta: string
  medioNotificacion: '' | NotificationChannelKey
  naturalezaJuridica: '' | PersonTypeKey
  direccion: string
  pais: string
  codigoPostal: string
  provincia: string
  localidad: string
  correoElectronico: string
  fax: string
  telefono: string
}

const expedienteTypeOptions: Array<{
  value: ExpedienteTypeKey
  label: string
  backendValue: string
}> = [
  {
    value: 'brecha-seguridad',
    label: 'Brecha de seguridad',
    backendValue: 'BRECHA DE SEGURIDAD',
  },
  {
    value: 'consultas',
    label: 'Consultas',
    backendValue: 'CONSULTAS',
  },
  {
    value: 'consultas-previas',
    label: 'Consultas previas',
    backendValue: 'CONSULTAS PREVIAS',
  },
  {
    value: 'sugerencias-quejas',
    label: 'Sugerencias y quejas',
    backendValue: 'SUGERENCIAS Y QUEJAS',
  },
  {
    value: 'delegado-proteccion-datos',
    label: 'Delegado de proteccion de datos',
    backendValue: 'DELEGADO DE PROTECCION DE DATOS',
  },
]

const operationModeOptions: Array<{
  value: OperationModeKey
  label: string
  backendValue: string
}> = [
  {
    value: 'peticion-interesado',
    label: 'A peticion del interesado',
    backendValue: 'A PETICION DEL INTERESADO',
  },
  {
    value: 'de-oficio',
    label: 'De oficio',
    backendValue: 'DE OFICIO',
  },
]

const operationDetailByExpediente: Record<
  ExpedienteTypeKey,
  Array<{ value: string; label: string; backendValue: string }>
> = {
  'brecha-seguridad': [
    {
      value: 'adicional-modificacion',
      label: 'Adicional (modificacion)',
      backendValue: 'ADICIONAL (MODIFICACION)',
    },
    { value: 'completa', label: 'Completa', backendValue: 'COMPLETA' },
    { value: 'inicial', label: 'Inicial', backendValue: 'INICIAL' },
  ],
  consultas: [
    {
      value: 'alta-consulta',
      label: 'Alta consulta',
      backendValue: 'ALTA CONSULTA',
    },
  ],
  'consultas-previas': [
    {
      value: 'alta-consulta-previa',
      label: 'Alta consulta previa',
      backendValue: 'ALTA CONSULTA PREVIA',
    },
  ],
  'sugerencias-quejas': [
    {
      value: 'alta-sugerencia-queja',
      label: 'Alta sugerencia/queja',
      backendValue: 'ALTA SUGERENCIA/QUEJA',
    },
  ],
  'delegado-proteccion-datos': [
    {
      value: 'modificacion',
      label: 'Modificacion',
      backendValue: 'MODIFICACION',
    },
  ],
}

const notificationChannelOptions: Array<{
  value: NotificationChannelKey
  label: string
}> = [
  { value: 'correo-electronico', label: 'Correo electronico' },
  { value: 'correo-postal', label: 'Correo postal' },
]

const documentTypeOptions = ['NIF', 'NIE', 'PASAPORTE', 'OTROS']

const emptyPartyData: PartyData = {
  naturalezaJuridica: '',
  tipoDocumento: '',
  numeroDocumento: '',
  nombre: '',
  primerApellido: '',
  segundoApellido: '',
  medioNotificacion: '',
  correoElectronico: '',
  direccionPostal: '',
  telefono: '',
}

const emptyConsultaData: ConsultaData = {
  titulo: '',
  consulta: '',
  medioNotificacion: '',
  naturalezaJuridica: '',
  direccion: '',
  pais: 'ESPANA',
  codigoPostal: '',
  provincia: '',
  localidad: '',
  correoElectronico: '',
  fax: '',
  telefono: '',
}

const countryOptions = ['ESPANA']

const provinceOptions = [
  'A CORUNA',
  'ALAVA',
  'ALBACETE',
  'ALICANTE',
  'ALMERIA',
  'ASTURIAS',
  'AVILA',
  'BADAJOZ',
  'BARCELONA',
  'BIZKAIA',
  'BURGOS',
  'CACERES',
  'CADIZ',
  'CANTABRIA',
  'CASTELLON',
  'CIUDAD REAL',
  'CORDOBA',
  'CUENCA',
  'GIRONA',
  'GRANADA',
  'GUADALAJARA',
  'GIPUZKOA',
  'HUELVA',
  'HUESCA',
  'ILLES BALEARS',
  'JAEN',
  'LA RIOJA',
  'LAS PALMAS',
  'LEON',
  'LLEIDA',
  'LUGO',
  'MADRID',
  'MALAGA',
  'MURCIA',
  'NAVARRA',
  'OURENSE',
  'PALENCIA',
  'PONTEVEDRA',
  'SALAMANCA',
  'SANTA CRUZ DE TENERIFE',
  'SEGOVIA',
  'SEVILLA',
  'SORIA',
  'TARRAGONA',
  'TERUEL',
  'TOLEDO',
  'VALENCIA',
  'VALLADOLID',
  'ZAMORA',
  'ZARAGOZA',
]

const localityOptionsByProvince: Record<string, string[]> = {
  'A CORUNA': ['A CORUNA', 'FERROL', 'SANTIAGO DE COMPOSTELA'],
  ALAVA: ['VITORIA-GASTEIZ', 'LLODIO', 'AMURRIO'],
  ALBACETE: ['ALBACETE', 'HELLIN', 'VILLARROBLEDO'],
  ALICANTE: ['ALICANTE', 'ELCHE', 'BENIDORM'],
  ALMERIA: ['ALMERIA', 'ROQUETAS DE MAR', 'EL EJIDO'],
  ASTURIAS: ['OVIEDO', 'GIJON', 'AVILES'],
  AVILA: ['AVILA', 'AREVALO', 'EL TIEMBLO'],
  BADAJOZ: ['BADAJOZ', 'MERIDA', 'ALMENDRALEJO'],
  BARCELONA: ['BARCELONA', 'L HOSPITALET DE LLOBREGAT', 'BADALONA'],
  BIZKAIA: ['BILBAO', 'BARAKALDO', 'GETXO'],
  BURGOS: ['BURGOS', 'ARANDA DE DUERO', 'MIRANDA DE EBRO'],
  CACERES: ['CACERES', 'PLASENCIA', 'NAVALMORAL DE LA MATA'],
  CADIZ: ['CADIZ', 'JEREZ DE LA FRONTERA', 'ALGECIRAS'],
  CANTABRIA: ['SANTANDER', 'TORRELAVEGA', 'CASTRO-URDIALES'],
  CASTELLON: ['CASTELLON DE LA PLANA', 'VILA-REAL', 'BURRIANA'],
  'CIUDAD REAL': ['CIUDAD REAL', 'PUERTOLLANO', 'TOMELLOSO'],
  CORDOBA: ['CORDOBA', 'LUCENA', 'PUENTE GENIL'],
  CUENCA: ['CUENCA', 'TARANCON', 'SAN CLEMENTE'],
  GIRONA: ['GIRONA', 'FIGUERES', 'BLANES'],
  GRANADA: ['GRANADA', 'MOTRIL', 'ALMUNECAR'],
  GUADALAJARA: ['GUADALAJARA', 'AZUQUECA DE HENARES', 'MOLINA DE ARAGON'],
  GIPUZKOA: ['DONOSTIA-SAN SEBASTIAN', 'IRUN', 'EIBAR'],
  HUELVA: ['HUELVA', 'LEPE', 'ALMONTE'],
  HUESCA: ['HUESCA', 'BARBASTRO', 'JACA'],
  'ILLES BALEARS': ['PALMA', 'EIVISSA', 'MAO'],
  JAEN: ['JAEN', 'LINARES', 'ANDUJAR'],
  'LA RIOJA': ['LOGRONO', 'CALAHORRA', 'ARNEDO'],
  'LAS PALMAS': ['LAS PALMAS DE GRAN CANARIA', 'TELDE', 'ARRECIFE'],
  LEON: ['LEON', 'PONFERRADA', 'SAN ANDRES DEL RABANEDO'],
  LLEIDA: ['LLEIDA', 'BALAGUER', 'TARREGA'],
  LUGO: ['LUGO', 'MONFORTE DE LEMOS', 'VIVEIRO'],
  MADRID: ['MADRID', 'MOSTOLES', 'ALCALA DE HENARES'],
  MALAGA: ['MALAGA', 'MARBELLA', 'FUENGIROLA'],
  MURCIA: ['MURCIA', 'CARTAGENA', 'LORCA'],
  NAVARRA: ['PAMPLONA', 'TUDELA', 'ESTELLA-LIZARRA'],
  OURENSE: ['OURENSE', 'VERIN', 'O BARCO DE VALDEORRAS'],
  PALENCIA: ['PALENCIA', 'AGUILAR DE CAMPOO', 'VENTA DE BANOS'],
  PONTEVEDRA: ['PONTEVEDRA', 'VIGO', 'VILAGARCIA DE AROUSA'],
  SALAMANCA: ['SALAMANCA', 'BEJAR', 'CIUDAD RODRIGO'],
  'SANTA CRUZ DE TENERIFE': ['SANTA CRUZ DE TENERIFE', 'SAN CRISTOBAL DE LA LAGUNA', 'ARONA'],
  SEGOVIA: ['SEGOVIA', 'CUELLAR', 'EL ESPINAR'],
  SEVILLA: ['SEVILLA', 'DOS HERMANAS', 'ALCALA DE GUADAIRA'],
  SORIA: ['SORIA', 'ALMAZAN', 'EL BURGO DE OSMA'],
  TARRAGONA: ['TARRAGONA', 'REUS', 'TORTOSA'],
  TERUEL: ['TERUEL', 'ALCANIZ', 'ANDORRA'],
  TOLEDO: ['TOLEDO', 'TALAVERA DE LA REINA', 'ILLESCAS'],
  VALENCIA: ['VALENCIA', 'GANDIA', 'TORRENT'],
  VALLADOLID: ['VALLADOLID', 'MEDINA DEL CAMPO', 'LAGUNA DE DUERO'],
  ZAMORA: ['ZAMORA', 'BENAVENTE', 'TORO'],
  ZARAGOZA: ['ZARAGOZA', 'CALATAYUD', 'UTEBO'],
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function buildPartySummary(label: string, party: PartyData): string {
  const lines = [
    `${label}:`,
    `- Naturaleza juridica: ${party.naturalezaJuridica || 'N/A'}`,
    `- Tipo de documento: ${party.tipoDocumento || 'N/A'}`,
    `- Numero de documento: ${party.numeroDocumento || 'N/A'}`,
    `- Nombre: ${party.nombre || 'N/A'}`,
    `- Primer apellido: ${party.primerApellido || 'N/A'}`,
    `- Segundo apellido: ${party.segundoApellido || 'N/A'}`,
    `- Medio notificacion: ${party.medioNotificacion || 'N/A'}`,
    `- Correo electronico: ${party.correoElectronico || 'N/A'}`,
    `- Direccion postal: ${party.direccionPostal || 'N/A'}`,
    `- Telefono: ${party.telefono || 'N/A'}`,
  ]

  return lines.join('\n')
}

function getMissingPartyFieldLabel(party: PartyData): string | null {
  if (!party.naturalezaJuridica) {
    return 'Naturaleza juridica'
  }

  if (isBlank(party.tipoDocumento)) {
    return 'Tipo de documento'
  }

  if (isBlank(party.numeroDocumento)) {
    return 'N de documento'
  }

  if (isBlank(party.nombre)) {
    return 'Nombre'
  }

  if (isBlank(party.primerApellido)) {
    return 'Primer apellido'
  }

  if (!party.medioNotificacion) {
    return 'Medio notificacion'
  }

  if (party.medioNotificacion === 'correo-electronico' && isBlank(party.correoElectronico)) {
    return 'Correo electronico'
  }

  if (party.medioNotificacion === 'correo-postal' && isBlank(party.direccionPostal)) {
    return 'Direccion postal'
  }

  return null
}

function getMissingConsultaFieldLabel(consulta: ConsultaData): string | null {
  if (isBlank(consulta.titulo)) {
    return 'Titulo consulta'
  }

  if (isBlank(consulta.consulta)) {
    return 'Consulta'
  }

  if (!consulta.medioNotificacion) {
    return 'Medio notificacion'
  }

  if (!consulta.naturalezaJuridica) {
    return 'Naturaleza juridica'
  }

  if (consulta.medioNotificacion === 'correo-electronico' && isBlank(consulta.correoElectronico)) {
    return 'Correo electronico'
  }

  if (consulta.medioNotificacion === 'correo-postal') {
    if (isBlank(consulta.direccion)) {
      return 'Direccion'
    }

    if (isBlank(consulta.pais)) {
      return 'Pais'
    }

    if (isBlank(consulta.codigoPostal)) {
      return 'Codigo postal'
    }

    if (isBlank(consulta.provincia)) {
      return 'Provincia'
    }

    if (isBlank(consulta.localidad)) {
      return 'Localidad'
    }
  }

  return null
}

function buildConsultaSummary(consulta: ConsultaData): string {
  const lines = [
    'Consulta:',
    `- Titulo consulta: ${consulta.titulo}`,
    `- Consulta: ${consulta.consulta}`,
    `- Medio notificacion: ${consulta.medioNotificacion || 'N/A'}`,
    'Solicitante:',
    `- Naturaleza juridica: ${consulta.naturalezaJuridica || 'N/A'}`,
    `- Correo electronico: ${consulta.correoElectronico || 'N/A'}`,
    `- Direccion: ${consulta.direccion || 'N/A'}`,
    `- Pais: ${consulta.pais || 'N/A'}`,
    `- Codigo postal: ${consulta.codigoPostal || 'N/A'}`,
    `- Provincia: ${consulta.provincia || 'N/A'}`,
    `- Localidad: ${consulta.localidad || 'N/A'}`,
    `- Fax: ${consulta.fax || 'N/A'}`,
    `- Telefono: ${consulta.telefono || 'N/A'}`,
  ]

  return lines.join('\n')
}

export function NewExpedientePage({ auth, onClose, onCreated }: NewExpedientePageProps) {
  const navigate = useNavigate()
  const [setupStepOpen, setSetupStepOpen] = useState(true)
  const [setupError, setSetupError] = useState('')
  const [setup, setSetup] = useState<{
    expedienteType: '' | ExpedienteTypeKey
    operationMode: '' | OperationModeKey
    operationDetail: string
  }>({
    expedienteType: '',
    operationMode: '',
    operationDetail: '',
  })

  const [form, setForm] = useState({
    tipo: '',
    procedimiento: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [consultaData, setConsultaData] = useState<ConsultaData>(emptyConsultaData)
  const [solicitante, setSolicitante] = useState<PartyData>(emptyPartyData)
  const [representante, setRepresentante] = useState<PartyData>(emptyPartyData)
  const [sugerenciasStep, setSugerenciasStep] = useState<'solicitante' | 'representante'>('solicitante')

  useEffect(() => {
    const scrollY = window.scrollY
    const originalPosition = document.body.style.position
    const originalTop = document.body.style.top
    const originalWidth = document.body.style.width
    const originalOverflow = document.body.style.overflow

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.position = originalPosition
      document.body.style.top = originalTop
      document.body.style.width = originalWidth
      document.body.style.overflow = originalOverflow
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    if (!message) {
      return
    }

    const timer = window.setTimeout(() => {
      setMessage('')
    }, 2000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    if (!error) {
      return
    }

    const timer = window.setTimeout(() => {
      setError('')
    }, 4000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [error])

  const detailOptions = useMemo(
    () =>
      setup.expedienteType
        ? operationDetailByExpediente[setup.expedienteType]
        : [],
    [setup.expedienteType],
  )

  const selectedExpedienteType = useMemo(
    () => expedienteTypeOptions.find((option) => option.value === setup.expedienteType) ?? null,
    [setup.expedienteType],
  )

  const selectedOperationMode = useMemo(
    () => operationModeOptions.find((option) => option.value === setup.operationMode) ?? null,
    [setup.operationMode],
  )

  const selectedOperationDetail = useMemo(
    () => detailOptions.find((option) => option.value === setup.operationDetail) ?? null,
    [detailOptions, setup.operationDetail],
  )

  const availableConsultaLocalidades = useMemo(
    () => (consultaData.provincia ? localityOptionsByProvince[consultaData.provincia] ?? [] : []),
    [consultaData.provincia],
  )

  const isConsultasFlow =
    setup.expedienteType === 'consultas' || setup.expedienteType === 'consultas-previas'

  const isSugerenciasFlow = setup.expedienteType === 'sugerencias-quejas'

  const closeDialog = () => {
    if (onClose) {
      onClose()
      return
    }

    navigate('/')
  }

  const onContinueGeneralSetup = () => {
    setSetupError('')

    if (!setup.expedienteType || !setup.operationMode || !setup.operationDetail) {
      setSetupError('Debes completar todos los campos obligatorios para continuar.')
      return
    }

    if (!selectedExpedienteType || !selectedOperationMode || !selectedOperationDetail) {
      setSetupError('No se pudo resolver la combinacion seleccionada.')
      return
    }

    const nextProcedimiento = `${selectedOperationDetail.backendValue} - ${selectedOperationMode.backendValue}`

    setForm((prev) => ({
      ...prev,
      tipo: selectedExpedienteType.backendValue,
      procedimiento: nextProcedimiento,
    }))
    setSugerenciasStep('solicitante')
    setSetupStepOpen(false)
  }

  const onGoToRepresentanteStep = () => {
    setError('')

    const missingSolicitanteField = getMissingPartyFieldLabel(solicitante)

    if (missingSolicitanteField) {
      setError(`Solicitante: falta completar ${missingSolicitanteField}.`)
      return
    }

    setSugerenciasStep('representante')
  }

  const onGoBackStep = () => {
    setError('')

    if (setupStepOpen) {
      closeDialog()
      return
    }

    if (isSugerenciasFlow && sugerenciasStep === 'representante') {
      setSugerenciasStep('solicitante')
      return
    }

    setSetupStepOpen(true)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (isConsultasFlow) {
      const missingConsultaField = getMissingConsultaFieldLabel(consultaData)
      if (missingConsultaField) {
        setError(`Consulta: falta completar ${missingConsultaField}.`)
        return
      }
    }

    if (isSugerenciasFlow) {
      const missingSolicitanteField = getMissingPartyFieldLabel(solicitante)
      if (missingSolicitanteField) {
        setError(`Solicitante: falta completar ${missingSolicitanteField}.`)
        return
      }

      const missingRepresentanteField = getMissingPartyFieldLabel(representante)
      if (missingRepresentanteField) {
        setError(`Representante: falta completar ${missingRepresentanteField}.`)
        return
      }
    }

    const asuntoGenerado = isConsultasFlow
      ? consultaData.titulo.trim()
      : `${selectedExpedienteType?.label ?? form.tipo} - ${selectedOperationDetail?.label ?? 'Alta'}`.trim()
    const descriptionSections: string[] = []

    if (isConsultasFlow) {
      descriptionSections.push(buildConsultaSummary(consultaData))
    }

    if (isSugerenciasFlow) {
      descriptionSections.push(`\n${buildPartySummary('Solicitante', solicitante)}`)
      descriptionSections.push(`\n${buildPartySummary('Representante', representante)}`)
    }

    const payload = {
      ...form,
      asunto: asuntoGenerado,
      descripcion:
        descriptionSections.filter((section) => section.length > 0).join('\n\n') ||
        `Alta de expediente ${selectedExpedienteType?.label ?? form.tipo}`,
    }

    const parsed = createSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulario invalido')
      return
    }

    setSubmitting(true)
    void createExpediente(auth, parsed.data)
      .then((created) =>
        assignExpedienteToMe(auth, created.id)
          .then(() => created)
          .catch((assignmentError) => {
            throw {
              kind: 'assignment',
              assignmentError,
            }
          }),
      )
      .then((created) => {
        setMessage(`Expediente ${created.numeroExpediente} creado y asignado correctamente.`)

        if (onCreated) {
          onCreated(created)
          return
        }

        closeDialog()
      })
      .catch((caught) => {
        if (
          typeof caught === 'object' &&
          caught !== null &&
          'kind' in caught &&
          caught.kind === 'assignment'
        ) {
          setError('El expediente se creo, pero no se pudo asignar automaticamente a tu usuario.')
          return
        }

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
    <div className="assignment-modal-backdrop" role="presentation">
      <article
        className="assignment-modal setup-new-exp-modal new-exp-dialog card border-0 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-new-exp-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="assignment-modal-header">
          <div>
            <h2 id="setup-new-exp-title">Crear expediente</h2>
            {setupStepOpen ? <p className="mb-0 text-secondary">Datos generales</p> : null}
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm icon-action-btn"
            onClick={closeDialog}
            aria-label="Cerrar alta de expediente"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {setupStepOpen ? (
          <>
            <div className="setup-new-exp-step">Los campos con (*) son obligatorios</div>

            <div className="assignment-modal-body">
              <label>
                <span className="field-label"><span className="required-mark">(*)</span> Tipo de expediente</span>
                <select
                  className="form-select"
                  value={setup.expedienteType}
                  onChange={(event) => {
                    const nextType = event.target.value as '' | ExpedienteTypeKey
                    setSetup((prev) => ({
                      ...prev,
                      expedienteType: nextType,
                      operationDetail: '',
                    }))
                  }}
                >
                  <option value="">Seleccionar</option>
                  {expedienteTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label"><span className="required-mark">(*)</span> Tipo de operacion (detalle)</span>
                <select
                  className="form-select"
                  value={setup.operationDetail}
                  onChange={(event) =>
                    setSetup((prev) => ({
                      ...prev,
                      operationDetail: event.target.value,
                    }))
                  }
                  disabled={!setup.expedienteType}
                >
                  <option value="">Seleccionar</option>
                  {detailOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label"><span className="required-mark">(*)</span> Tipo de solicitud</span>
                <select
                  className="form-select"
                  value={setup.operationMode}
                  onChange={(event) =>
                    setSetup((prev) => ({
                      ...prev,
                      operationMode: event.target.value as '' | OperationModeKey,
                    }))
                  }
                >
                  <option value="">Seleccionar</option>
                  {operationModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {setupError ? <p className="text-danger mb-0">{setupError}</p> : null}

              <div className="wizard-actions">
                <div className="wizard-actions-left">
                  {/* First step does not need back navigation */}
                </div>
                <div className="wizard-actions-right">
                  <button
                    type="button"
                    className="btn btn-aepd-orange btn-sm"
                    onClick={onContinueGeneralSetup}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <form className="assignment-modal-body new-exp-dialog-body" onSubmit={onSubmit}>
            <div className="new-exp-progress" aria-label="Progreso del alta">
              <span className="new-exp-progress-pill is-active">Datos generales</span>
              {isConsultasFlow ? (
                <>
                  <span className="new-exp-progress-pill is-active">Documentos</span>
                  <span className="new-exp-progress-pill is-active">Solicitante</span>
                </>
              ) : (
                <span className={`new-exp-progress-pill ${isSugerenciasFlow ? 'is-active' : ''}`}>
                  Datos del expediente
                </span>
              )}
              {isSugerenciasFlow ? (
                <span className={`new-exp-progress-pill ${sugerenciasStep === 'representante' ? 'is-active' : ''}`}>
                  Representante
                </span>
              ) : null}
            </div>

            {isConsultasFlow ? (
              <>
                <fieldset className="new-exp-extra-block">
                  <legend>Consulta</legend>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Titulo consulta</span>
                    <input
                      className="form-control"
                      value={consultaData.titulo}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, titulo: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Consulta</span>
                    <textarea
                      className="form-control"
                      value={consultaData.consulta}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, consulta: event.target.value }))
                      }
                      rows={4}
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Medio notificacion</span>
                    <select
                      className="form-select"
                      value={consultaData.medioNotificacion}
                      onChange={(event) =>
                        setConsultaData((prev) => ({
                          ...prev,
                          medioNotificacion: event.target.value as '' | NotificationChannelKey,
                        }))
                      }
                    >
                      <option value="">Seleccionar</option>
                      {notificationChannelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>

                <fieldset className="new-exp-extra-block">
                  <legend>Solicitante</legend>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Naturaleza juridica</span>
                    <div className="new-exp-radio-row mt-1">
                      <label className="new-exp-radio-option mb-0">
                        <input
                          type="radio"
                          name="consultaSolicitanteNaturaleza"
                          checked={consultaData.naturalezaJuridica === 'persona-fisica'}
                          onChange={() =>
                            setConsultaData((prev) => ({
                              ...prev,
                              naturalezaJuridica: 'persona-fisica',
                            }))
                          }
                        />
                        Persona fisica
                      </label>
                      <label className="new-exp-radio-option mb-0">
                        <input
                          type="radio"
                          name="consultaSolicitanteNaturaleza"
                          checked={consultaData.naturalezaJuridica === 'persona-juridica'}
                          onChange={() =>
                            setConsultaData((prev) => ({
                              ...prev,
                              naturalezaJuridica: 'persona-juridica',
                            }))
                          }
                        />
                        Persona juridica
                      </label>
                    </div>
                  </label>

                  {consultaData.medioNotificacion === 'correo-electronico' ? (
                    <label>
                      <span className="field-label"><span className="required-mark">(*)</span> Correo electronico</span>
                      <input
                        className="form-control"
                        value={consultaData.correoElectronico}
                        onChange={(event) =>
                          setConsultaData((prev) => ({
                            ...prev,
                            correoElectronico: event.target.value,
                          }))
                        }
                        placeholder="usuario@dominio.ext"
                      />
                    </label>
                  ) : null}

                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Direccion</span>
                    <input
                      className="form-control"
                      value={consultaData.direccion}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, direccion: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Pais</span>
                    <select
                      className="form-select"
                      value={consultaData.pais}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, pais: event.target.value }))
                      }
                    >
                      {countryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Codigo postal</span>
                    <input
                      className="form-control"
                      value={consultaData.codigoPostal}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, codigoPostal: event.target.value }))
                      }
                      placeholder="Formato esperado 28001"
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Provincia</span>
                    <select
                      className="form-select"
                      value={consultaData.provincia}
                      onChange={(event) =>
                        setConsultaData((prev) => ({
                          ...prev,
                          provincia: event.target.value,
                          localidad: '',
                        }))
                      }
                    >
                      <option value="">Seleccionar</option>
                      {provinceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Localidad</span>
                    <select
                      className="form-select"
                      value={consultaData.localidad}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, localidad: event.target.value }))
                      }
                      disabled={!consultaData.provincia}
                    >
                      <option value="">Seleccionar</option>
                      {availableConsultaLocalidades.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Fax
                    <input
                      className="form-control"
                      value={consultaData.fax}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, fax: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Telefono
                    <input
                      className="form-control"
                      value={consultaData.telefono}
                      onChange={(event) =>
                        setConsultaData((prev) => ({ ...prev, telefono: event.target.value }))
                      }
                      placeholder="Formato esperado 666666666"
                    />
                  </label>
                </fieldset>
              </>
            ) : null}

            {isSugerenciasFlow && sugerenciasStep === 'solicitante' ? (
              <>
                <fieldset className="new-exp-extra-block">
                  <legend>Solicitante</legend>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Naturaleza juridica</span>
                    <div className="new-exp-radio-row mt-1">
                      <label className="new-exp-radio-option mb-0">
                        <input
                          type="radio"
                          name="solicitanteNaturaleza"
                          checked={solicitante.naturalezaJuridica === 'persona-fisica'}
                          onChange={() =>
                            setSolicitante((prev) => ({
                              ...prev,
                              naturalezaJuridica: 'persona-fisica',
                            }))
                          }
                        />
                        Persona fisica
                      </label>
                      <label className="new-exp-radio-option mb-0">
                        <input
                          type="radio"
                          name="solicitanteNaturaleza"
                          checked={solicitante.naturalezaJuridica === 'persona-juridica'}
                          onChange={() =>
                            setSolicitante((prev) => ({
                              ...prev,
                              naturalezaJuridica: 'persona-juridica',
                            }))
                          }
                        />
                        Persona juridica
                      </label>
                    </div>
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Tipo de documento</span>
                    <select
                      className="form-select"
                      value={solicitante.tipoDocumento}
                      onChange={(event) =>
                        setSolicitante((prev) => ({ ...prev, tipoDocumento: event.target.value }))
                      }
                    >
                      <option value="">Seleccionar</option>
                      {documentTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> N de documento</span>
                    <input
                      className="form-control"
                      value={solicitante.numeroDocumento}
                      onChange={(event) =>
                        setSolicitante((prev) => ({ ...prev, numeroDocumento: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Nombre</span>
                    <input
                      className="form-control"
                      value={solicitante.nombre}
                      onChange={(event) =>
                        setSolicitante((prev) => ({ ...prev, nombre: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Primer apellido</span>
                    <input
                      className="form-control"
                      value={solicitante.primerApellido}
                      onChange={(event) =>
                        setSolicitante((prev) => ({ ...prev, primerApellido: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Segundo apellido
                    <input
                      className="form-control"
                      value={solicitante.segundoApellido}
                      onChange={(event) =>
                        setSolicitante((prev) => ({ ...prev, segundoApellido: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Medio notificacion</span>
                    <select
                      className="form-select"
                      value={solicitante.medioNotificacion}
                      onChange={(event) =>
                        setSolicitante((prev) => {
                          const nextMedium = event.target.value as '' | NotificationChannelKey
                          return {
                            ...prev,
                            medioNotificacion: nextMedium,
                            correoElectronico:
                              nextMedium === 'correo-postal' ? '' : prev.correoElectronico,
                            direccionPostal:
                              nextMedium === 'correo-electronico' ? '' : prev.direccionPostal,
                          }
                        })
                      }
                    >
                      <option value="">Seleccionar</option>
                      {notificationChannelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {solicitante.medioNotificacion === 'correo-electronico' ? (
                    <label>
                      Correo electronico
                      <input
                        className="form-control"
                        value={solicitante.correoElectronico}
                        onChange={(event) =>
                          setSolicitante((prev) => ({ ...prev, correoElectronico: event.target.value }))
                        }
                        placeholder="usuario@dominio.ext"
                      />
                    </label>
                  ) : null}
                  {solicitante.medioNotificacion === 'correo-postal' ? (
                    <label>
                      Direccion postal
                      <input
                        className="form-control"
                        value={solicitante.direccionPostal}
                        onChange={(event) =>
                          setSolicitante((prev) => ({ ...prev, direccionPostal: event.target.value }))
                        }
                        placeholder="Direccion completa de notificacion"
                      />
                    </label>
                  ) : null}
                  <label>
                    Telefono
                    <input
                      className="form-control"
                      value={solicitante.telefono}
                      onChange={(event) =>
                        setSolicitante((prev) => ({ ...prev, telefono: event.target.value }))
                      }
                    />
                  </label>
                </fieldset>

              </>
            ) : null}

            {isSugerenciasFlow && sugerenciasStep === 'representante' ? (
              <fieldset className="new-exp-extra-block">
                  <legend>Representante</legend>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Naturaleza juridica</span>
                    <div className="new-exp-radio-row mt-1">
                      <label className="new-exp-radio-option mb-0">
                        <input
                          type="radio"
                          name="representanteNaturaleza"
                          checked={representante.naturalezaJuridica === 'persona-fisica'}
                          onChange={() =>
                            setRepresentante((prev) => ({
                              ...prev,
                              naturalezaJuridica: 'persona-fisica',
                            }))
                          }
                        />
                        Persona fisica
                      </label>
                      <label className="new-exp-radio-option mb-0">
                        <input
                          type="radio"
                          name="representanteNaturaleza"
                          checked={representante.naturalezaJuridica === 'persona-juridica'}
                          onChange={() =>
                            setRepresentante((prev) => ({
                              ...prev,
                              naturalezaJuridica: 'persona-juridica',
                            }))
                          }
                        />
                        Persona juridica
                      </label>
                    </div>
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Tipo de documento</span>
                    <select
                      className="form-select"
                      value={representante.tipoDocumento}
                      onChange={(event) =>
                        setRepresentante((prev) => ({ ...prev, tipoDocumento: event.target.value }))
                      }
                    >
                      <option value="">Seleccionar</option>
                      {documentTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> N de documento</span>
                    <input
                      className="form-control"
                      value={representante.numeroDocumento}
                      onChange={(event) =>
                        setRepresentante((prev) => ({ ...prev, numeroDocumento: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Nombre</span>
                    <input
                      className="form-control"
                      value={representante.nombre}
                      onChange={(event) =>
                        setRepresentante((prev) => ({ ...prev, nombre: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Primer apellido</span>
                    <input
                      className="form-control"
                      value={representante.primerApellido}
                      onChange={(event) =>
                        setRepresentante((prev) => ({ ...prev, primerApellido: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Segundo apellido
                    <input
                      className="form-control"
                      value={representante.segundoApellido}
                      onChange={(event) =>
                        setRepresentante((prev) => ({ ...prev, segundoApellido: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span className="field-label"><span className="required-mark">(*)</span> Medio notificacion</span>
                    <select
                      className="form-select"
                      value={representante.medioNotificacion}
                      onChange={(event) =>
                        setRepresentante((prev) => {
                          const nextMedium = event.target.value as '' | NotificationChannelKey
                          return {
                            ...prev,
                            medioNotificacion: nextMedium,
                            correoElectronico:
                              nextMedium === 'correo-postal' ? '' : prev.correoElectronico,
                            direccionPostal:
                              nextMedium === 'correo-electronico' ? '' : prev.direccionPostal,
                          }
                        })
                      }
                    >
                      <option value="">Seleccionar</option>
                      {notificationChannelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {representante.medioNotificacion === 'correo-electronico' ? (
                    <label>
                      Correo electronico
                      <input
                        className="form-control"
                        value={representante.correoElectronico}
                        onChange={(event) =>
                          setRepresentante((prev) => ({ ...prev, correoElectronico: event.target.value }))
                        }
                        placeholder="usuario@dominio.ext"
                      />
                    </label>
                  ) : null}
                  {representante.medioNotificacion === 'correo-postal' ? (
                    <label>
                      Direccion postal
                      <input
                        className="form-control"
                        value={representante.direccionPostal}
                        onChange={(event) =>
                          setRepresentante((prev) => ({ ...prev, direccionPostal: event.target.value }))
                        }
                        placeholder="Direccion completa de notificacion"
                      />
                    </label>
                  ) : null}
                  <label>
                    Telefono
                    <input
                      className="form-control"
                      value={representante.telefono}
                      onChange={(event) =>
                        setRepresentante((prev) => ({ ...prev, telefono: event.target.value }))
                      }
                    />
                  </label>
                </fieldset>
            ) : null}

            <div className="wizard-actions">
              <div className="wizard-actions-left">
                <button type="button" className="btn btn-outline-secondary" onClick={onGoBackStep}>
                  Volver
                </button>
              </div>
              <div className="wizard-actions-right">
                {isSugerenciasFlow && sugerenciasStep === 'solicitante' ? (
                  <button type="button" className="btn btn-aepd-orange" onClick={onGoToRepresentanteStep}>
                    Siguiente
                  </button>
                ) : (
                  <button className="btn btn-primary" type="submit" disabled={submitting}>
                    {submitting ? 'Creando...' : 'Finalizar'}
                  </button>
                )}
              </div>
            </div>

            {message ? <div className="alert alert-success py-2 mb-0">{message}</div> : null}
            {error ? <div className="alert alert-danger py-2 mb-0">{error}</div> : null}
          </form>
        )}
      </article>
    </div>
  )
}
