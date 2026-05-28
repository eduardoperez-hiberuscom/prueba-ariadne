package com.example.expedientes.service;

import com.example.expedientes.dto.DocumentoDTO;
import com.example.expedientes.dto.PlantillaRespuestaDTO;
import com.example.expedientes.entity.Documento;
import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.EstadoDocumento;
import com.example.expedientes.entity.PlantillaDocumento;
import com.example.expedientes.entity.PlantillaRespuesta;
import com.example.expedientes.entity.Usuario;
import com.example.expedientes.repository.DocumentoRepository;
import com.example.expedientes.repository.ExpedienteRepository;
import com.example.expedientes.repository.PlantillaDocumentoRepository;
import com.example.expedientes.repository.PlantillaRespuestaRepository;
import com.example.expedientes.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service: Generador de Documentos
 * RF-3: Generar documentos dinámicamente con plantillas
 * Q-3: Híbrido <5MB síncrono, ≥5MB asincrónico
 */
@Service
@Slf4j
@Transactional
public class GeneradorDocumentosService {

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private PlantillaRespuestaRepository plantillaRespuestaRepository;

    @Autowired
    private PlantillaDocumentoRepository plantillaDocumentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuditLogger auditLogger;

    @Value("${storage.filesystem.base-path:/opt/expedientes-system/storage}")
    private String storagePath;

    private static final long LIMITE_ASYNC_BYTES = 5 * 1024 * 1024;  // 5MB (Q-3)
        private static final String FASE_GENERAR_RESOLUCION = "GENERAR_RESOLUCION";
        private static final String PLANTILLA_DOCUMENTO_CODIGO = "RESOLUCION_TRAMITACION_CONJUNTA_DPD";
        private static final String TIPO_DOCUMENTO_RESOLUCION = "RESOLUCION_TRAMITACION_CONJUNTA";

        public List<PlantillaRespuestaDTO> listarPlantillasRespuesta() {
        return plantillaRespuestaRepository.findByActivoTrueOrderByTituloAsc().stream()
            .map(this::mapPlantillaRespuestaDTO)
            .collect(Collectors.toList());
        }

        public DocumentoDTO generarResolucionDesdePlantilla(
            Long expedienteId,
            Long plantillaRespuestaId,
            String contenidoRespuesta,
            String usuarioUid) {
        if (plantillaRespuestaId == null) {
            throw new IllegalArgumentException("Debe seleccionar una plantilla de respuesta");
        }

        Expediente expediente = obtenerExpedienteAsignado(expedienteId, usuarioUid);

        if (!FASE_GENERAR_RESOLUCION.equals(expediente.getFase())) {
            throw new IllegalStateException("El expediente no esta en fase de generar resolucion");
        }

        PlantillaRespuesta plantillaRespuesta = plantillaRespuestaRepository.findById(plantillaRespuestaId)
            .filter(PlantillaRespuesta::getActivo)
            .orElseThrow(() -> new IllegalArgumentException("Plantilla de respuesta no valida"));

        PlantillaDocumento plantillaDocumento = plantillaDocumentoRepository
            .findByCodigoAndActivoTrue(PLANTILLA_DOCUMENTO_CODIGO)
            .orElseThrow(() -> new IllegalStateException("No existe plantilla base de documento"));

        String respuesta = (contenidoRespuesta == null || contenidoRespuesta.trim().isEmpty())
            ? plantillaRespuesta.getContenido()
            : contenidoRespuesta.trim();

        String contenidoDocumento = plantillaDocumento.getContenidoBase()
            .replace("{{RESPUESTA}}", respuesta)
            .replace("{{NUMERO_EXPEDIENTE}}", expediente.getNumeroExpediente())
            .replace("{{ASUNTO}}", Optional.ofNullable(expediente.getAsunto()).orElse(""))
            .replace("{{FECHA_GENERACION}}", LocalDateTime.now().toString());

        int siguienteVersion = documentoRepository
            .findTopByExpedienteAndTipoOrderByVersionDocDesc(expediente, TIPO_DOCUMENTO_RESOLUCION)
            .map(doc -> doc.getVersionDoc() + 1)
            .orElse(1);

        Documento documento = Documento.builder()
            .expediente(expediente)
            .tipo(TIPO_DOCUMENTO_RESOLUCION)
            .versionDoc(siguienteVersion)
            .estado(EstadoDocumento.GENERADO)
            .rutaArchivo("BBDD")
            .contenido(contenidoDocumento)
            .plantillaCodigo(plantillaDocumento.getCodigo())
            .plantillaRespuestaCodigo(plantillaRespuesta.getCodigo())
            .tamanioBytes((long) contenidoDocumento.getBytes().length)
            .fechaCreacion(LocalDateTime.now())
            .build();

        Documento saved = documentoRepository.save(documento);
        auditLogger.log(usuarioUid, "GENERACION_RESOLUCION_DESDE_PLANTILLA",
            "Documento de resolucion generado con plantilla " + plantillaRespuesta.getCodigo(), expediente.getId());

        return mapToDTO(saved);
    }

    public List<DocumentoDTO> listarDocumentosResolucion(Long expedienteId, String usuarioUid) {
        Expediente expediente = obtenerExpedienteAsignado(expedienteId, usuarioUid);
        return documentoRepository.findByExpedienteAndTipoOrderByVersionDocDesc(
                expediente,
                TIPO_DOCUMENTO_RESOLUCION)
            .stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    /**
     * RF-3: Generar documento
     * Si >5MB, ejecutar asincronía
     */
    public DocumentoDTO generarDocumento(Long expedienteId, String tipo, 
                                         Map<String, String> variables, String usuarioUid) {
        log.info("Generando documento: tipo={}, expediente={}", tipo, expedienteId);

        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));

        // Procesar plantilla
        String contenido = procesarPlantilla(tipo, variables);
        byte[] contenidoBytes = contenido.getBytes();

        // Determinar si es sincrónico o asincrónico
        if (contenidoBytes.length >= LIMITE_ASYNC_BYTES) {
            log.info("Documento >5MB, procesando asincronía...");
            generarDocumentoAsync(expediente, tipo, contenidoBytes, usuarioUid);
            return createAsyncResponse(expedienteId);
        }

        // Síncrono (<5MB)
        return generarDocumentoSincronico(expediente, tipo, contenidoBytes, usuarioUid);
    }

    /**
     * Procesamiento síncrono (<5MB)
     */
    private DocumentoDTO generarDocumentoSincronico(Expediente expediente, String tipo,
                                                    byte[] contenido, String usuarioUid) {
        try {
            // Guardar archivo
            String rutaArchivo = guardarArchivo(expediente, tipo, contenido);

            // Crear documento versión v1
            Documento documento = Documento.builder()
                    .expediente(expediente)
                    .tipo(tipo)
                    .versionDoc(1)
                    .estado(EstadoDocumento.PENDIENTE)
                    .rutaArchivo(rutaArchivo)
                    .contenido(new String(contenido))
                    .tamanioBytes((long) contenido.length)
                    .fechaCreacion(LocalDateTime.now())
                    .build();

            Documento saved = documentoRepository.save(documento);

            // Auditoría
            auditLogger.log(usuarioUid, "GENERACION_DOCUMENTO",
                    "Documento generado: " + tipo + " v1", expediente.getId());

            return mapToDTO(saved);
        } catch (Exception e) {
            log.error("Error generando documento", e);
            throw new RuntimeException("Error al generar documento", e);
        }
    }

    /**
     * Procesamiento asincrónico (≥5MB) - Q-3
     */
    @Async
    private void generarDocumentoAsync(Expediente expediente, String tipo,
                                       byte[] contenido, String usuarioUid) {
        try {
            Thread.sleep(500);  // Simular procesamiento pesado
            String rutaArchivo = guardarArchivo(expediente, tipo, contenido);

            Documento documento = Documento.builder()
                    .expediente(expediente)
                    .tipo(tipo)
                    .versionDoc(1)
                    .estado(EstadoDocumento.PENDIENTE)
                    .rutaArchivo(rutaArchivo)
                    .contenido(new String(contenido))
                    .tamanioBytes((long) contenido.length)
                    .fechaCreacion(LocalDateTime.now())
                    .build();

            documentoRepository.save(documento);
            auditLogger.log(usuarioUid, "GENERACION_DOCUMENTO_ASYNC",
                    "Documento generado (async): " + tipo, expediente.getId());
        } catch (Exception e) {
            log.error("Error en generación asincrónica", e);
        }
    }

    /**
     * Guardar archivo en filesystem local (Q-2)
     */
    private String guardarArchivo(Expediente expediente, String tipo, byte[] contenido) 
            throws Exception {
        Path dirExpediente = Paths.get(storagePath, expediente.getNumeroExpediente());
        Files.createDirectories(dirExpediente);

        String nombreArchivo = tipo + "_v1_" + System.currentTimeMillis() + ".pdf";
        Path rutaCompleta = dirExpediente.resolve(nombreArchivo);

        Files.write(rutaCompleta, contenido);
        log.info("Archivo guardado: {}", rutaCompleta);

        return rutaCompleta.toString();
    }

    /**
     * Procesador de plantillas (sustitución de variables)
     */
    private String procesarPlantilla(String tipo, Map<String, String> variables) {
        String plantilla = cargarPlantilla(tipo);

        // Sustitución de {{variables}}
        for (Map.Entry<String, String> var : variables.entrySet()) {
            plantilla = plantilla.replace("{{" + var.getKey() + "}}", var.getValue());
        }

        return plantilla;
    }

    /**
     * Cargar plantilla (stub)
     */
    private String cargarPlantilla(String tipo) {
        // Implementar carga desde BD o filesystem
        return "--- DOCUMENTO: " + tipo + " ---\n{{contenido}}\n\nGenerado: {{fecha}}";
    }

    private DocumentoDTO mapToDTO(Documento documento) {
        return DocumentoDTO.builder()
                .id(documento.getId())
                .expedienteId(documento.getExpediente().getId())
                .tipo(documento.getTipo())
                .version(documento.getVersionDoc())
                .estado(documento.getEstado().toString())
                .rutaArchivo(documento.getRutaArchivo())
                .contenido(documento.getContenido())
                .plantillaCodigo(documento.getPlantillaCodigo())
                .plantillaRespuestaCodigo(documento.getPlantillaRespuestaCodigo())
                .tamanioBytes(documento.getTamanioBytes())
                .build();
    }

    private PlantillaRespuestaDTO mapPlantillaRespuestaDTO(PlantillaRespuesta plantilla) {
        return PlantillaRespuestaDTO.builder()
                .id(plantilla.getId())
                .codigo(plantilla.getCodigo())
                .titulo(plantilla.getTitulo())
                .contenido(plantilla.getContenido())
                .build();
    }

    private Expediente obtenerExpedienteAsignado(Long expedienteId, String usuarioUid) {
        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));
        Usuario usuario = resolveUsuario(usuarioUid);

        if (expediente.getAsignadoA() == null || !usuario.getId().equals(expediente.getAsignadoA().getId())) {
            throw new IllegalStateException("El expediente no esta asignado al usuario actual");
        }

        return expediente;
    }

    private Usuario resolveUsuario(String usuarioUid) {
        Optional<Usuario> direct = usuarioRepository.findByUid(usuarioUid);
        if (direct.isPresent()) {
            return direct.get();
        }

        return usuarioRepository.findByUid(usuarioUid + ".ldap")
                .orElseThrow(() -> new IllegalArgumentException("No existe usuario para uid: " + usuarioUid));
    }

    private DocumentoDTO createAsyncResponse(Long expedienteId) {
        return DocumentoDTO.builder()
                .expedienteId(expedienteId)
                .estado("PROCESANDO_ASYNC")
                .build();
    }
}
