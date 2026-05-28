package com.example.expedientes.dto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentoDTO implements Serializable {
    private Long id;
    private Long expedienteId;
    private Long actuacionId;
    private String tipo;
    private Integer version;
    private String estado;
    private String rutaArchivo;
    private Long tamanioBytes;
    private String idPortafirmas;
    private LocalDateTime fechaFirma;
    private String razonRechazo;
}
