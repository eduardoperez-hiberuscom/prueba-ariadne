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
@Table(name = "PLANTILLAS_RESPUESTA")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlantillaRespuesta implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "plantilla_respuesta_seq")
    @SequenceGenerator(name = "plantilla_respuesta_seq", sequenceName = "SEQ_PLANTILLAS_RESPUESTA", allocationSize = 1)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String codigo;

    @Column(nullable = false, length = 255)
    private String titulo;

    @Lob
    @Column(nullable = false)
    private String contenido;

    @Column(nullable = false)
    private Boolean activo = true;

    @CreationTimestamp
    private LocalDateTime fechaCreacion;
}