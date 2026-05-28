package com.example.expedientes.controller;

import com.example.expedientes.dto.ExpedienteDTO;
import com.example.expedientes.service.ExpedienteService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Controller: Expediente (REST API)
 * RF-1: CRUD de expedientes
 */
@RestController
@RequestMapping("/api/gestor/expedientes")
@Slf4j
public class ExpedienteController {

    @Autowired
    private ExpedienteService expedienteService;

    /**
     * POST /api/gestor/expedientes
     * RF-1: Crear expediente administrativo
     */
    @PostMapping
    public ResponseEntity<ExpedienteDTO> crearExpediente(
            @RequestBody ExpedienteDTO dto,
            Principal principal) {
        log.info("POST /expedientes - usuario: {}", principal.getName());

        try {
            ExpedienteDTO created = expedienteService.crearExpediente(dto, principal.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.warn("Validación fallida: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/gestor/expedientes/{id}
     * Obtener expediente por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExpedienteDTO> obtenerExpediente(@PathVariable Long id) {
        log.info("GET /expedientes/{}", id);

        try {
            ExpedienteDTO expediente = expedienteService.obtenerExpediente(id);
            return ResponseEntity.ok(expediente);
        } catch (RuntimeException e) {
            log.error("Expediente no encontrado: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/gestor/expedientes
     * Listar todos los expedientes con paginación
     */
    @GetMapping
    public ResponseEntity<Page<ExpedienteDTO>> listarExpedientes(Pageable pageable) {
        log.info("GET /expedientes - pageable: {}", pageable);

        Page<ExpedienteDTO> expedientes = expedienteService.listarExpedientes(pageable);
        return ResponseEntity.ok(expedientes);
    }

    /**
     * GET /api/gestor/expedientes/numero/{numero}
     * Buscar por número de expediente
     */
    @GetMapping("/numero/{numero}")
    public ResponseEntity<ExpedienteDTO> buscarPorNumero(@PathVariable String numero) {
        log.info("GET /expedientes/numero/{}", numero);

        return expedienteService.buscarPorNumero(numero)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
