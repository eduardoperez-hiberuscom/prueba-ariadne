package com.example.expedientes.dto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActuacionDTO implements Serializable {
    private Long id;
    private Long expedienteId;
    private String tipo;
    private String estado;
    private Long asignadoAId;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
}