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
 * Entity: Documento
 * RF-3: Documentos con versionado y almacenamiento
 */
@Entity
@Table(name = "DOCUMENTOS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Documento implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "documento_seq")
    @SequenceGenerator(name = "documento_seq", sequenceName = "SEQ_DOCUMENTOS", allocationSize = 1)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "expediente_id", nullable = false)
    private Expediente expediente;

    @ManyToOne
    @JoinColumn(name = "actuacion_id")
    private Actuacion actuacion;

    @Column(nullable = false, length = 100)
    private String tipo;  // Requerimiento, Resolucion, etc.

    @Column(nullable = false)
    private Integer versionDoc;  // v1, v2, v3

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoDocumento estado;

    @Column(nullable = false, length = 500)
    private String rutaArchivo;  // Filesystem path

    @Lob
    private String contenido;

    @Column(length = 100)
    private String plantillaCodigo;

    @Column(length = 100)
    private String plantillaRespuestaCodigo;

    private Long tamanioBytes;

    // Portafirmas fields
    private String idPortafirmas;
    private String certificadoFirmante;
    private LocalDateTime fechaFirma;
    private String razonRechazo;

    @Version
    private Long version;  // Optimistic locking

    @CreationTimestamp
    private LocalDateTime fechaCreacion;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;  // Soft delete
}


