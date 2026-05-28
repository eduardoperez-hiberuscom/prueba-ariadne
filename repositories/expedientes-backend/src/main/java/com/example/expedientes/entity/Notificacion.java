package com.example.expedientes.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.*;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Entity: Notificación
 * RF-6: Queue de notificaciones con retry
 */
@Entity
@Table(name = "NOTIFICACIONES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notificacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notif_seq")
    @SequenceGenerator(name = "notif_seq", sequenceName = "SEQ_NOTIFICACIONES", allocationSize = 1)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "expediente_id", nullable = false)
    private Expediente expediente;

    @ManyToOne
    @JoinColumn(name = "documento_id")
    private Documento documento;

    @Column(nullable = false, length = 255)
    private String emailDestinatario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoNotificacion estado;

    @Column(nullable = false)
    private Integer intentosRealizados = 0;

    private LocalDateTime proximoReintento;

    @Column(length = 500)
    private String mensajeError;

    @CreationTimestamp
    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaEnvio;
}

/**
 * Estados de Notificación
 */
