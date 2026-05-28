package com.example.expedientes.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "PLANTILLAS_DOCUMENTO")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlantillaDocumento implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "plantilla_documento_seq")
    @SequenceGenerator(name = "plantilla_documento_seq", sequenceName = "SEQ_PLANTILLAS_DOCUMENTO", allocationSize = 1)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String codigo;

    @Column(nullable = false, length = 255)
    private String nombreArchivo;

    @Lob
    @Column(nullable = false)
    private String contenidoBase;

    @Column(nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    private LocalDateTime fechaCreacion;
}