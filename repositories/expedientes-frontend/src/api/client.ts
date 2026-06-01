import axios from 'axios'
import type {
  AuthCredentials,
  Documento,
  Expediente,
  GenerarResolucionPayload,
  GenerateDocumentoPayload,
  NewExpedientePayload,
  PageResult,
  PlantillaRespuesta,
  ReviewAdministrativaPayload,
  Usuario,
} from '../types/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
})

function authHeader(auth: AuthCredentials): string {
  const encoded = window.btoa(`${auth.username}:${auth.password}`)
  return `Basic ${encoded}`
}

function withAuth(auth: AuthCredentials) {
  return {
    headers: {
      Authorization: authHeader(auth),
    },
  }
}

export async function listExpedientes(
  auth: AuthCredentials,
  page = 0,
  size = 8,
): Promise<PageResult<Expediente>> {
  const response = await api.get<PageResult<Expediente>>('/gestor/expedientes', {
    ...withAuth(auth),
    params: {
      page,
      size,
      sort: 'fechaCreacion,desc',
    },
  })

  return response.data
}

export async function getExpedienteById(
  auth: AuthCredentials,
  id: number,
): Promise<Expediente> {
  const response = await api.get<Expediente>(`/gestor/expedientes/${id}`, withAuth(auth))
  return response.data
}

export async function getExpedienteByNumero(
  auth: AuthCredentials,
  numero: string,
): Promise<Expediente> {
  const response = await api.get<Expediente>(
    `/gestor/expedientes/numero/${numero}`,
    withAuth(auth),
  )
  return response.data
}

export async function createExpediente(
  auth: AuthCredentials,
  payload: NewExpedientePayload,
): Promise<Expediente> {
  const response = await api.post<Expediente>(
    '/gestor/expedientes',
    payload,
    withAuth(auth),
  )
  return response.data
}

export async function listMyAssignedExpedientes(
  auth: AuthCredentials,
  page = 0,
  size = 8,
): Promise<PageResult<Expediente>> {
  const response = await api.get<PageResult<Expediente>>('/gestor/expedientes/asignacion/mis', {
    ...withAuth(auth),
    params: {
      page,
      size,
      sort: 'fechaCreacion,desc',
    },
  })

  return response.data
}

export async function listUnassignedExpedientes(
  auth: AuthCredentials,
  page = 0,
  size = 8,
): Promise<PageResult<Expediente>> {
  const response = await api.get<PageResult<Expediente>>(
    '/gestor/expedientes/asignacion/sin-asignar',
    {
      ...withAuth(auth),
      params: {
        page,
        size,
        sort: 'fechaCreacion,desc',
      },
    },
  )

  return response.data
}

export async function assignExpedienteToMe(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<Expediente> {
  const response = await api.put<Expediente>(
    `/gestor/expedientes/${expedienteId}/asignacion/auto`,
    {},
    withAuth(auth),
  )

  return response.data
}

export async function unassignExpedienteFromMe(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<Expediente> {
  const response = await api.delete<Expediente>(
    `/gestor/expedientes/${expedienteId}/asignacion/auto`,
    withAuth(auth),
  )

  return response.data
}

export async function listUsuarios(auth: AuthCredentials): Promise<Usuario[]> {
  const response = await api.get<Usuario[]>('/gestor/usuarios', withAuth(auth))
  return response.data
}

export async function assignExpedienteToUser(
  auth: AuthCredentials,
  expedienteId: number,
  usuarioId: number | null,
): Promise<Expediente> {
  const response = await api.put<Expediente>(
    `/gestor/expedientes/${expedienteId}/asignacion`,
    { usuarioId },
    withAuth(auth),
  )

  return response.data
}

export async function completeAdministrativeReview(
  auth: AuthCredentials,
  expedienteId: number,
  payload: ReviewAdministrativaPayload,
): Promise<Expediente> {
  const response = await api.put<Expediente>(
    `/gestor/expedientes/${expedienteId}/revision-administrativa/generar-resolucion`,
    payload,
    withAuth(auth),
  )

  return response.data
}

export async function rollbackExpedientePhase(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<Expediente> {
  const response = await api.put<Expediente>(
    `/gestor/expedientes/${expedienteId}/fase/anterior`,
    {},
    withAuth(auth),
  )

  return response.data
}

export async function advanceExpedienteToEsperaPortafirmas(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<Expediente> {
  const response = await api.put<Expediente>(
    `/gestor/expedientes/${expedienteId}/fase/espera-portafirmas`,
    {},
    withAuth(auth),
  )

  return response.data
}

export async function approveExpedienteVistoBueno(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<Expediente> {
  const response = await api.put<Expediente>(
    `/gestor/expedientes/${expedienteId}/fase/visto-bueno/aprobar`,
    {},
    withAuth(auth),
  )

  return response.data
}

export async function rejectExpedienteVistoBueno(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<Expediente> {
  const response = await api.put<Expediente>(
    `/gestor/expedientes/${expedienteId}/fase/visto-bueno/rechazar`,
    {},
    withAuth(auth),
  )

  return response.data
}

export async function listPlantillasRespuesta(
  auth: AuthCredentials,
): Promise<PlantillaRespuesta[]> {
  const response = await api.get<PlantillaRespuesta[]>(
    '/gestor/documentos/plantillas/respuesta',
    withAuth(auth),
  )

  return response.data
}

export async function generateResolutionDocument(
  auth: AuthCredentials,
  expedienteId: number,
  payload: GenerarResolucionPayload,
): Promise<Documento> {
  const response = await api.post<Documento>(
    '/gestor/documentos/resolucion',
    payload,
    {
      ...withAuth(auth),
      params: {
        expedienteId,
      },
    },
  )

  return response.data
}

export async function listResolutionDocuments(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<Documento[]> {
  const response = await api.get<Documento[]>('/gestor/documentos/resolucion', {
    ...withAuth(auth),
    params: {
      expedienteId,
    },
  })

  return response.data
}

export async function clearResolutionDocuments(
  auth: AuthCredentials,
  expedienteId: number,
): Promise<void> {
  await api.delete('/gestor/documentos/resolucion', {
    ...withAuth(auth),
    params: {
      expedienteId,
    },
  })
}

export async function generateDocumento(
  auth: AuthCredentials,
  payload: GenerateDocumentoPayload,
): Promise<Documento> {
  const response = await api.post<Documento>(
    '/gestor/documentos',
    payload.variables,
    {
      ...withAuth(auth),
      params: {
        expedienteId: payload.expedienteId,
        tipo: payload.tipo,
      },
    },
  )
  return response.data
}