package com.example.expedientes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerarResolucionRequestDTO implements Serializable {
    private Long plantillaRespuestaId;
    private String contenidoRespuesta;
    private String textoRespuestaResolucion;

    public String resolveTextoRespuestaResolucion() {
        if (StringUtils.hasText(textoRespuestaResolucion)) {
            return textoRespuestaResolucion.trim();
        }
        return contenidoRespuesta;
    }
}