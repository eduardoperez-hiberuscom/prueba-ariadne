package com.example.expedientes.service;

import com.example.expedientes.entity.Notificacion;
import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.EstadoNotificacion;
import com.example.expedientes.repository.NotificacionRepository;
import com.example.expedientes.repository.ExpedienteRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service: Notificaciones
 * RF-6: Envío de notificaciones por email con reintentos (Q-5, Q-6)
 */
@Service
@Slf4j
@Transactional
public class NotificacionService {

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private ExpedienteRepository expedienteRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${integrations.notificaciones.email-from:noreply@expedientes.gob.es}")
    private String emailFrom;

    private static final int MAX_REINTENTOS = 3;
    private static final long DELAY_REINTENTO_MS = 60000;  // 1 minuto

    /**
     * RF-6: Enviar notificación (crear en queue)
     */
    public void enviarNotificacion(Long expedienteId, String emailDestinatario, 
                                   String asunto, String mensaje) {
        log.info("Creando notificación para: {}", emailDestinatario);

        Expediente expediente = expedienteRepository.findById(expedienteId)
                .orElseThrow(() -> new RuntimeException("Expediente no encontrado"));

        Notificacion notificacion = Notificacion.builder()
                .expediente(expediente)
                .emailDestinatario(emailDestinatario)
                .estado(EstadoNotificacion.PENDIENTE)
                .intentosRealizados(0)
                .fechaCreacion(LocalDateTime.now())
                .build();

        notificacionRepository.save(notificacion);
        log.info("Notificación creada en queue: {}", notificacion.getId());

        // Intentar enviar inmediatamente
        procesarNotificacion(notificacion.getId(), asunto, mensaje);
    }

    /**
     * Procesar notificación individual
     */
    private void procesarNotificacion(Long notificacionId, String asunto, String mensaje) {
        try {
            Notificacion notificacion = notificacionRepository.findById(notificacionId)
                    .orElseThrow(() -> new RuntimeException("No encontrado"));

            if (notificacion.getIntentosRealizados() >= MAX_REINTENTOS) {
                notificacion.setEstado(EstadoNotificacion.FALLIDA);
                notificacionRepository.save(notificacion);
                log.warn("Notificación fallida tras {} intentos", MAX_REINTENTOS);
                return;
            }

            // Enviar email (Q-6: Email only)
            enviarEmail(notificacion.getEmailDestinatario(), asunto, mensaje);

            notificacion.setEstado(EstadoNotificacion.ENVIADA);
            notificacion.setFechaEnvio(LocalDateTime.now());
        } catch (Exception e) {
            log.error("Error enviando notificación", e);

            Notificacion notificacion = notificacionRepository.findById(notificacionId).orElseThrow(() -> new RuntimeException("No encontrado"));
            notificacion.setIntentosRealizados(notificacion.getIntentosRealizados() + 1);
            notificacion.setProximoReintento(LocalDateTime.now().plusSeconds(30 * notificacion.getIntentosRealizados()));
            notificacion.setMensajeError(e.getMessage());
            notificacionRepository.save(notificacion);
        }
    }

    /**
     * Enviar email (Q-6)
     */
    private void enviarEmail(String emailDestinatario, String asunto, String mensaje) {
        if (mailSender == null) {
            log.warn("JavaMailSender no configurado, simulando envío");
            return;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(emailFrom);
            mail.setTo(emailDestinatario);
            mail.setSubject(asunto);
            mail.setText(mensaje);

            mailSender.send(mail);
            log.info("Email enviado a: {}", emailDestinatario);
        } catch (Exception e) {
            log.error("Error enviando email", e);
            throw e;
        }
    }

    /**
     * Task programado (Q-5): Procesar reintentos cada 5 minutos
     */
    @Scheduled(fixedRate = 300000)  // 5 minutos
    public void procesarReintentos() {
        log.info("Procesando reintentos de notificaciones...");

        List<Notificacion> pendientes = notificacionRepository
                .findByProximoReintentoLessThanEqual(LocalDateTime.now());

        for (Notificacion notif : pendientes) {
            procesarNotificacion(notif.getId(), 
                    "Notificación Expediente", 
                    "Contenido de notificación");
        }

        log.info("Reintentos procesados: {}", pendientes.size());
    }
}
