package com.example.expedientes.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.*;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Entity: Evento Histórico (Auditoría)
 * RF-10: Auditoría inmutable de todas las acciones
 */
@Entity
@Table(name = "EVENTOS_HISTORICO")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventoHistorico implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "evento_seq")
    @SequenceGenerator(name = "evento_seq", sequenceName = "SEQ_EVENTOS", allocationSize = 1)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "expediente_id", nullable = false)
    private Expediente expediente;

    @Column(nullable = false, length = 50)
    private String tipoEvento;  // CREACION, TRANSICION, FIRMA, NOTIFICACION, ACCESO_USUARIO

    @Column(nullable = false, length = 500)
    private String descripcion;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;  // Quién realizó la acción

    @CreationTimestamp
    private LocalDateTime timestamp;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    // No permitir updates (auditoría inmutable)
    @PreUpdate
    protected void onUpdate() {
        throw new UnsupportedOperationException("Evento histórico no puede ser modificado");
    }
}
