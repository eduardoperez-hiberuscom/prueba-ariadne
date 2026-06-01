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
public class PlantillaRespuestaDTO implements Serializable {
    private Long id;
    private String codigo;
    private String titulo;
    private String contenido;
}