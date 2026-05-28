package com.example.expedientes.dto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificacionDTO implements Serializable {
    private Long id;
    private Long expedienteId;
    private String emailDestinatario;
    private String estado;
    private Integer intentosRealizados;
    private LocalDateTime proximoReintento;
}