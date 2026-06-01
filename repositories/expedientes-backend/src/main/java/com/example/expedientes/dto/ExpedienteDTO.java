package com.example.expedientes.dto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpedienteDTO implements Serializable {
    private Long id;
    private String numeroExpediente;
    private String asunto;
    private String tipo;
    private String estado;
    private String fase;
    private String procedimiento;
    private String descripcion;
    private Long interesadoId;
    private Long asignadoAId;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private List<ActuacionDTO> actuaciones;
    private List<EventoHistoricoDTO> historico;
}