package com.example.expedientes.dto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventoHistoricoDTO implements Serializable {
    private Long id;
    private Long expedienteId;
    private String tipoEvento;
    private String descripcion;
    private Long usuarioId;
    private LocalDateTime timestamp;
    private String ipAddress;
}