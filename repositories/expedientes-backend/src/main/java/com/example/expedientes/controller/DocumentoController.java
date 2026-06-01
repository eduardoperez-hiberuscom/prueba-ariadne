package com.example.expedientes.controller;

import com.example.expedientes.dto.DocumentoDTO;
import com.example.expedientes.dto.GenerarResolucionRequestDTO;
import com.example.expedientes.dto.PlantillaRespuestaDTO;
import com.example.expedientes.service.GeneradorDocumentosService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller: Documento (REST API)
 * RF-3: Generación de documentos
 */
@RestController
@RequestMapping("/api/gestor/documentos")
@Slf4j
public class DocumentoController {

    @Autowired
    private GeneradorDocumentosService generadorDocumentosService;

    @GetMapping("/plantillas/respuesta")
    public ResponseEntity<List<PlantillaRespuestaDTO>> listarPlantillasRespuesta() {
        return ResponseEntity.ok(generadorDocumentosService.listarPlantillasRespuesta());
    }

    @GetMapping("/resolucion")
    public ResponseEntity<List<DocumentoDTO>> listarDocumentosResolucion(
            @RequestParam Long expedienteId,
            Principal principal) {
        try {
            return ResponseEntity.ok(generadorDocumentosService.listarDocumentosResolucion(expedienteId, principal.getName()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/resolucion")
    public ResponseEntity<Void> limpiarDocumentosResolucion(
            @RequestParam Long expedienteId,
            Principal principal) {
        try {
            generadorDocumentosService.limpiarDocumentosResolucion(expedienteId, principal.getName());
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/resolucion")
    public ResponseEntity<DocumentoDTO> generarResolucion(
            @RequestParam Long expedienteId,
            @RequestBody GenerarResolucionRequestDTO request,
            Principal principal) {
        try {
            DocumentoDTO documento = generadorDocumentosService.generarResolucionDesdePlantilla(
                    expedienteId,
                    request.getPlantillaRespuestaId(),
                    request.resolveTextoRespuestaResolucion(),
                    principal.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(documento);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST /api/gestor/documentos
     * RF-3: Generar documento
     */
    @PostMapping
    public ResponseEntity<DocumentoDTO> generarDocumento(
            @RequestParam Long expedienteId,
            @RequestParam String tipo,
            @RequestBody Map<String, String> variables,
            Principal principal) {
        log.info("POST /documentos - expediente: {}, tipo: {}", expedienteId, tipo);

        try {
            DocumentoDTO documento = generadorDocumentosService
                    .generarDocumento(expedienteId, tipo, variables, principal.getName());
            
            HttpStatus status = "PROCESANDO_ASYNC".equals(documento.getEstado()) 
                    ? HttpStatus.ACCEPTED 
                    : HttpStatus.CREATED;
            
            return ResponseEntity.status(status).body(documento);
        } catch (RuntimeException e) {
            log.error("Error generando documento", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * POST /api/gestor/documentos/{id}/invalida
     * Q-10: Marcar documento como INVALIDADO
     */
    @PostMapping("/{id}/invalida")
    public ResponseEntity<?> invalidarDocumento(
            @PathVariable Long id,
            @RequestBody Map<String, String> razon,
            Principal principal) {
        log.info("POST /documentos/{}/invalida", id);
        
        // TODO: Implementar InvalidarDocumentoService
        return ResponseEntity.ok().build();
    }
}
