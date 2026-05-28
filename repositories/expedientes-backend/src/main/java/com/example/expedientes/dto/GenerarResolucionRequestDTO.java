package com.example.expedientes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerarResolucionRequestDTO implements Serializable {
    private Long plantillaRespuestaId;
    private String contenidoRespuesta;
}