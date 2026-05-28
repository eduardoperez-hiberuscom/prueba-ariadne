package com.example.expedientes.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity: Actuacion
 * RF-9: Múltiples actuaciones por expediente
 */
@Entity
@Table(name = "ACTUACIONES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Actuacion implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "actuacion_seq")
    @SequenceGenerator(name = "actuacion_seq", sequenceName = "SEQ_ACTUACIONES", allocationSize = 1)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "expediente_id", nullable = false)
    private Expediente expediente;

    @Column(nullable = false, length = 100)
    private String tipo;  // Requerimiento, Resolucion

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoActuacion estado;

    @ManyToOne
    @JoinColumn(name = "asignado_a_id")
    private Usuario asignadoA;

    @OneToMany(mappedBy = "actuacion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Documento> documentos;

    @CreationTimestamp
    private LocalDateTime fechaInicio;

    private LocalDateTime fechaFin;
}

/**
 * Estados de Actuacion
 */
enum EstadoActuacion {
    INICIAL,
    EN_TRAMITACION,
    COMPLETADA,
    RECHAZADA
}
