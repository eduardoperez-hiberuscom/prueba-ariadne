package com.example.expedientes.service;

import com.example.expedientes.dto.ExpedienteDTO;
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

    private ExpedienteDTO mapToDTO(Expediente expediente) {
        return ExpedienteDTO.builder()
                .id(expediente.getId())
                .numeroExpediente(expediente.getNumeroExpediente())
                .asunto(expediente.getAsunto())
                .tipo(expediente.getTipo())
                .estado(expediente.getEstado().toString())
                .procedimiento(expediente.getProcedimiento())
                .descripcion(expediente.getDescripcion())
                .fechaCreacion(expediente.getFechaCreacion())
                .fechaActualizacion(expediente.getFechaActualizacion())
                .build();
    }
}
