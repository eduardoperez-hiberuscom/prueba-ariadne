package com.example.expedientes.service;

import com.example.expedientes.dto.ExpedienteDTO;
import com.example.expedientes.dto.UsuarioDTO;
import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.EventoHistorico;
import com.example.expedientes.entity.Usuario;
import com.example.expedientes.repository.ExpedienteRepository;
import com.example.expedientes.repository.EventoHistoricoRepository;
import com.example.expedientes.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Service: Expediente (RF-1: Crear expediente)
 */
@Service
@Slf4j
@Transactional
public class ExpedienteService {

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired
    private EventoHistoricoRepository historicoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuditLogger auditLogger;

    private static final String FASE_REVISION_ADMINISTRATIVA = "REVISION_ADMINISTRATIVA";
    private static final String FASE_GENERAR_RESOLUCION = "GENERAR_RESOLUCION";
        private static final String FASE_ESPERA_PORTAFIRMAS = "ESPERA_PORTAFIRMAS";
        private static final String FASE_NOTIFICAR_RESOLUCION = "NOTIFICAR_RESOLUCION";
        private static final String FASE_TRAMITADO = "TRAMITADO";
        private static final List<String> FASES_FLUJO = Arrays.asList(
            FASE_REVISION_ADMINISTRATIVA,
            FASE_GENERAR_RESOLUCION,
            FASE_ESPERA_PORTAFIRMAS,
            FASE_NOTIFICAR_RESOLUCION,
            FASE_TRAMITADO
        );

    /**
     * RF-1: Crear expediente administrativo
     * Genera número único YYYYMMDD-NNNNN
     */
    public ExpedienteDTO crearExpediente(ExpedienteDTO dto, String usuarioUid) {
        log.info("Creando expediente: {}", dto.getAsunto());

        // Validar datos
        if (dto.getAsunto() == null || dto.getAsunto().isEmpty()) {
            throw new IllegalArgumentException("Asunto requerido");
        }

        // Generar número expediente único
        String numeroExpediente = generarNumeroExpediente();

        // Obtener usuario interesado
        Optional<Usuario> interesado = usuarioRepository.findByUid(usuarioUid);

        // Crear expediente
        Expediente expediente = Expediente.builder()
                .numeroExpediente(numeroExpediente)
                .asunto(dto.getAsunto())
                .tipo(dto.getTipo() != null ? dto.getTipo() : "GENERAL")
                .estado(com.example.expedientes.entity.EstadoExpediente.INICIAL)
            .fase(FASE_REVISION_ADMINISTRATIVA)
                .descripcion(dto.getDescripcion())
                .procedimiento(dto.getProcedimiento())
                .interesado(interesado.orElse(null))
                .fechaCreacion(LocalDateTime.now())
                .build();

        Expediente saved = expedienteRepository.save(expediente);

        // Auditoría
        auditLogger.log(usuarioUid, "CREACION_EXPEDIENTE", 
                "Expediente creado: " + numeroExpediente, saved.getId());

        log.info("Expediente creado exitosamente: {}", numeroExpediente);
        return mapToDTO(saved);
    }

    /**
     * Obtener expediente por ID
     */
    public ExpedienteDTO obtenerExpediente(Long id) {
        Expediente expediente = expedienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado: " + id));
        return mapToDTO(expediente);
    }

    /**
     * Listar expedientes con paginación
     */
    public Page<ExpedienteDTO> listarExpedientes(Pageable pageable) {
        return expedienteRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

        /**
         * Obtener expedientes asignados al usuario autenticado.
         */
        public Page<ExpedienteDTO> listarMisAsignados(String usuarioUid, Pageable pageable) {
        Usuario usuario = resolveUsuario(usuarioUid);
        return expedienteRepository.findByAsignadoA(usuario, pageable)
            .map(this::mapToDTO);
        }

        /**
         * Obtener expedientes sin gestor asignado.
         */
        public Page<ExpedienteDTO> listarSinAsignar(Pageable pageable) {
        return expedienteRepository.findByAsignadoAIsNull(pageable)
            .map(this::mapToDTO);
        }

        /**
         * Asignar expediente al usuario autenticado.
         */
        public ExpedienteDTO autoAsignarExpediente(Long expedienteId, String usuarioUid) {
        Expediente expediente = expedienteRepository.findById(expedienteId)
            .orElseThrow(() -> new RuntimeException("Expediente no encontrado: " + expedienteId));
        Usuario usuario = resolveUsuario(usuarioUid);

        expediente.setAsignadoA(usuario);
        expediente.setFechaActualizacion(LocalDateTime.now());

        Expediente saved = expedienteRepository.save(expediente);
        auditLogger.log(usuarioUid, "ASIGNACION_EXPEDIENTE",
            "Autoasignado expediente: " + saved.getNumeroExpediente(), saved.getId());

        return mapToDTO(saved);
        }

        /**
         * Quitar asignacion del expediente.
         */
        public ExpedienteDTO desasignarExpediente(Long expedienteId, String usuarioUid) {
        Expediente expediente = expedienteRepository.findById(expedienteId)
            .orElseThrow(() -> new RuntimeException("Expediente no encontrado: " + expedienteId));

        expediente.setAsignadoA(null);
        expediente.setFechaActualizacion(LocalDateTime.now());

        Expediente saved = expedienteRepository.save(expediente);
        auditLogger.log(usuarioUid, "DESASIGNACION_EXPEDIENTE",
            "Desasignado expediente: " + saved.getNumeroExpediente(), saved.getId());

        return mapToDTO(saved);
        }

    public ExpedienteDTO asignarExpediente(Long expedienteId, Long usuarioId, String actorUid) {
        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado: " + expedienteId));

        Usuario usuarioAsignado = null;
        if (usuarioId != null) {
            usuarioAsignado = usuarioRepository.findById(usuarioId)
                    .filter(Usuario::getActivo)
                    .orElseThrow(() -> new IllegalArgumentException("Usuario no valido para asignacion"));
        }

        expediente.setAsignadoA(usuarioAsignado);
        expediente.setFechaActualizacion(LocalDateTime.now());

        Expediente saved = expedienteRepository.save(expediente);
        if (usuarioAsignado == null) {
            auditLogger.log(actorUid, "DESASIGNACION_EXPEDIENTE",
                    "Expediente desasignado manualmente: " + saved.getNumeroExpediente(), saved.getId());
        } else {
            auditLogger.log(actorUid, "REASIGNACION_EXPEDIENTE",
                    "Expediente asignado a " + usuarioAsignado.getUid() + ": " + saved.getNumeroExpediente(), saved.getId());
        }

        return mapToDTO(saved);
    }

    public List<UsuarioDTO> listarUsuariosActivos() {
        return usuarioRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::mapToUsuarioDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Guardar cambios de revision administrativa y avanzar a generar resolucion.
     */
    public ExpedienteDTO completarRevisionAdministrativa(
            Long expedienteId,
            ExpedienteDTO dto,
            String usuarioUid) {
        Expediente expediente = obtenerExpedienteAsignadoAlUsuario(expedienteId, usuarioUid);

        if (!FASE_REVISION_ADMINISTRATIVA.equals(expediente.getFase())) {
            throw new IllegalStateException("La fase actual no permite revision administrativa");
        }

        if (dto.getAsunto() == null || dto.getAsunto().trim().isEmpty()) {
            throw new IllegalArgumentException("Asunto requerido");
        }

        expediente.setAsunto(dto.getAsunto().trim());
        expediente.setTipo(dto.getTipo() == null || dto.getTipo().trim().isEmpty() ? expediente.getTipo() : dto.getTipo().trim());
        expediente.setProcedimiento(dto.getProcedimiento() == null ? expediente.getProcedimiento() : dto.getProcedimiento().trim());
        expediente.setDescripcion(dto.getDescripcion() == null ? expediente.getDescripcion() : dto.getDescripcion().trim());
        expediente.setEstado(com.example.expedientes.entity.EstadoExpediente.EN_TRAMITACION);
        expediente.setFase(FASE_GENERAR_RESOLUCION);
        expediente.setFechaActualizacion(LocalDateTime.now());

        Expediente saved = expedienteRepository.save(expediente);
        auditLogger.log(usuarioUid, "REVISION_ADMINISTRATIVA_COMPLETADA",
                "Expediente preparado para generar resolucion: " + saved.getNumeroExpediente(), saved.getId());

        return mapToDTO(saved);
    }

    public ExpedienteDTO retrocederFase(Long expedienteId, String usuarioUid) {
        Expediente expediente = obtenerExpedienteAsignadoAlUsuario(expedienteId, usuarioUid);
        int currentIndex = FASES_FLUJO.indexOf(expediente.getFase());

        if (currentIndex < 0) {
            throw new IllegalStateException("La fase actual no pertenece al flujo de tramitacion");
        }

        if (currentIndex == 0) {
            throw new IllegalStateException("Revision administrativa es la fase minima permitida");
        }

        String faseAnterior = FASES_FLUJO.get(currentIndex - 1);
        expediente.setFase(faseAnterior);
        expediente.setEstado(resolveEstadoPorFase(faseAnterior));
        expediente.setFechaActualizacion(LocalDateTime.now());

        Expediente saved = expedienteRepository.save(expediente);
        auditLogger.log(usuarioUid, "RETROCESO_FASE_EXPEDIENTE",
                "Expediente retrocedido a fase " + faseAnterior + ": " + saved.getNumeroExpediente(),
                saved.getId());

        return mapToDTO(saved);
    }

    /**
     * Buscar por número expediente
     */
    public Optional<ExpedienteDTO> buscarPorNumero(String numero) {
        return expedienteRepository.findByNumeroExpediente(numero)
                .map(this::mapToDTO);
    }

    /**
     * Generar número expediente YYYYMMDD-NNNNN
     */
    private String generarNumeroExpediente() {
        String fecha = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long secuencia = System.currentTimeMillis() % 100000;
        return fecha + "-" + String.format("%05d", secuencia);
    }

    private Usuario resolveUsuario(String usuarioUid) {
        Optional<Usuario> direct = usuarioRepository.findByUid(usuarioUid);
        if (direct.isPresent()) {
            return direct.get();
        }

        Optional<Usuario> withLdapSuffix = usuarioRepository.findByUid(usuarioUid + ".ldap");
        if (withLdapSuffix.isPresent()) {
            return withLdapSuffix.get();
        }

        throw new IllegalArgumentException("No existe usuario para uid: " + usuarioUid);
    }

    private Expediente obtenerExpedienteAsignadoAlUsuario(Long expedienteId, String usuarioUid) {
        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado: " + expedienteId));
        Usuario usuario = resolveUsuario(usuarioUid);

        if (expediente.getAsignadoA() == null || !usuario.getId().equals(expediente.getAsignadoA().getId())) {
            throw new IllegalStateException("El expediente no esta asignado al usuario actual");
        }

        return expediente;
    }

    private com.example.expedientes.entity.EstadoExpediente resolveEstadoPorFase(String fase) {
        if (FASE_REVISION_ADMINISTRATIVA.equals(fase)) {
            return com.example.expedientes.entity.EstadoExpediente.INICIAL;
        }

        if (FASE_TRAMITADO.equals(fase)) {
            return com.example.expedientes.entity.EstadoExpediente.CERRADO;
        }

        return com.example.expedientes.entity.EstadoExpediente.EN_TRAMITACION;
    }

    private ExpedienteDTO mapToDTO(Expediente expediente) {
        return ExpedienteDTO.builder()
                .id(expediente.getId())
                .numeroExpediente(expediente.getNumeroExpediente())
                .asunto(expediente.getAsunto())
                .tipo(expediente.getTipo())
                .estado(expediente.getEstado().toString())
            .fase(expediente.getFase())
                .procedimiento(expediente.getProcedimiento())
                .descripcion(expediente.getDescripcion())
                .interesadoId(expediente.getInteresado() != null ? expediente.getInteresado().getId() : null)
                .asignadoAId(expediente.getAsignadoA() != null ? expediente.getAsignadoA().getId() : null)
                .fechaCreacion(expediente.getFechaCreacion())
                .fechaActualizacion(expediente.getFechaActualizacion())
                .build();
    }

    private UsuarioDTO mapToUsuarioDTO(Usuario usuario) {
        return UsuarioDTO.builder()
                .id(usuario.getId())
                .uid(usuario.getUid())
                .nombre(usuario.getNombre())
                .email(usuario.getEmail())
                .rol(usuario.getRol())
                .build();
    }
}
