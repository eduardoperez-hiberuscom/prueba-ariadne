package com.example.expedientes.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.*;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity: Expediente Administrativo
 * RF-1: Crear expediente con número único, tipo, estado
 */
@Entity
@Table(name = "EXPEDIENTES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expediente implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "expediente_seq")
    @SequenceGenerator(name = "expediente_seq", sequenceName = "SEQ_EXPEDIENTES", allocationSize = 1)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String numeroExpediente;  // YYYYMMDD-NNNNN

    @Column(nullable = false, length = 100)
    private String asunto;

    @Column(nullable = false, length = 50)
    private String tipo;  // REQUERIMIENTO, RESOLUCION, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoExpediente estado;  // INICIAL, EN_TRAMITACION, CERRADO, etc.

    @Column(nullable = false, length = 100)
    private String fase;

    @ManyToOne
    @JoinColumn(name = "interesado_id")
    private Usuario interesado;

    @ManyToOne
    @JoinColumn(name = "asignado_a_id")
    private Usuario asignadoA;

    @OneToMany(mappedBy = "expediente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Actuacion> actuaciones;

    @OneToMany(mappedBy = "expediente", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EventoHistorico> historico;

    @Version
    private Long version;  // Optimistic locking

    @CreationTimestamp
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    private LocalDateTime fechaActualizacion;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;  // Soft delete (RGPD)

    private String descripcion;

    private String procedimiento;  // Referencia a procedimiento tipo
}

/**
 * Estados del Expediente
 */
