export interface AuthCredentials {
  username: string
  password: string
}

export interface Expediente {
  id: number
  numeroExpediente: string
  asunto: string
  tipo: string
  estado: string
  procedimiento: string
  descripcion: string
  interesadoId?: number | null
  asignadoAId?: number | null
  fechaCreacion: string
  fechaActualizacion?: string
}

export interface Documento {
  id?: number
  expedienteId: number
  tipo?: string
  version?: number
  estado: string
  rutaArchivo?: string
  tamanioBytes?: number
}

export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface NewExpedientePayload {
  asunto: string
  tipo: string
  descripcion: string
  procedimiento: string
}

export interface GenerateDocumentoPayload {
  expedienteId: number
  tipo: string
  variables: Record<string, string>
}