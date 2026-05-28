import axios from 'axios'
import type {
  AuthCredentials,
  Documento,
  Expediente,
  GenerateDocumentoPayload,
  NewExpedientePayload,
  PageResult,
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