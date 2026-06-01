package com.example.expedientes.service;

import com.example.expedientes.entity.EventoHistorico;
import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.Usuario;
import com.example.expedientes.repository.EventoHistoricoRepository;
import com.example.expedientes.repository.ExpedienteRepository;
import com.example.expedientes.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Utility: AuditLogger
 * RF-10: Auditoría inmutable de eventos
 * Implementa auditoría con EventoHistorico inmutable
 */
@Component
@Slf4j
public class AuditLogger {

    @Autowired
    private EventoHistoricoRepository historicoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    /**
     * Log de evento de auditoría
     */
    public void log(String usuarioUid, String tipoEvento, String descripcion, Long expedienteId) {
        try {
            Optional<Expediente> expediente = expedienteRepository.findById(expedienteId);
            Optional<Usuario> usuario = usuarioRepository.findByUid(usuarioUid);

            HttpServletRequest request = getHttpServletRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : "N/A";

            EventoHistorico evento = EventoHistorico.builder()
                    .expediente(expediente.orElse(null))
                    .tipoEvento(tipoEvento)
                    .descripcion(descripcion)
                    .usuario(usuario.orElse(null))
                    .timestamp(LocalDateTime.now())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            historicoRepository.save(evento);
            log.info("Auditoría registrada: {} - {}", tipoEvento, descripcion);

        } catch (Exception e) {
            log.error("Error al registrar auditoría", e);
        }
    }

    /**
     * Log simple sin expediente
     */
    public void logSimple(String usuarioUid, String tipoEvento, String descripcion) {
        log(usuarioUid, tipoEvento, descripcion, null);
    }

    private HttpServletRequest getHttpServletRequest() {
        try {
            ServletRequestAttributes attributes = 
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) return "N/A";
        
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
