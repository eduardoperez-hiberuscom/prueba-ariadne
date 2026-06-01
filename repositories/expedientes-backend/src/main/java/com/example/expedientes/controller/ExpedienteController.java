package com.example.expedientes.controller;

import com.example.expedientes.dto.AsignacionExpedienteDTO;
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
     * GET /api/gestor/expedientes/asignacion/mis
     * Bandeja de expedientes asignados al usuario autenticado.
     */
    @GetMapping("/asignacion/mis")
    public ResponseEntity<Page<ExpedienteDTO>> listarMisAsignados(
            Pageable pageable,
            Principal principal) {
        log.info("GET /expedientes/asignacion/mis - usuario: {}", principal.getName());

        try {
            Page<ExpedienteDTO> expedientes =
                    expedienteService.listarMisAsignados(principal.getName(), pageable);
            return ResponseEntity.ok(expedientes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/gestor/expedientes/asignacion/sin-asignar
     * Bandeja de expedientes sin asignacion.
     */
    @GetMapping("/asignacion/sin-asignar")
    public ResponseEntity<Page<ExpedienteDTO>> listarSinAsignar(Pageable pageable) {
        log.info("GET /expedientes/asignacion/sin-asignar");

        Page<ExpedienteDTO> expedientes = expedienteService.listarSinAsignar(pageable);
        return ResponseEntity.ok(expedientes);
    }

    /**
     * PUT /api/gestor/expedientes/{id}/asignacion/auto
     * Asignar expediente al propio usuario autenticado.
     */
    @PutMapping("/{id}/asignacion/auto")
    public ResponseEntity<ExpedienteDTO> autoAsignar(
            @PathVariable Long id,
            Principal principal) {
        log.info("PUT /expedientes/{}/asignacion/auto - usuario: {}", id, principal.getName());

        try {
            ExpedienteDTO dto = expedienteService.autoAsignarExpediente(id, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE /api/gestor/expedientes/{id}/asignacion/auto
     * Quitar asignacion del expediente.
     */
    @DeleteMapping("/{id}/asignacion/auto")
    public ResponseEntity<ExpedienteDTO> desasignar(
            @PathVariable Long id,
            Principal principal) {
        log.info("DELETE /expedientes/{}/asignacion/auto - usuario: {}", id, principal.getName());

        try {
            ExpedienteDTO dto = expedienteService.desasignarExpediente(id, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/gestor/expedientes/{id}/asignacion
     * Asignar o desasignar expediente a un usuario especifico.
     */
    @PutMapping("/{id}/asignacion")
    public ResponseEntity<ExpedienteDTO> asignar(
            @PathVariable Long id,
            @RequestBody AsignacionExpedienteDTO dto,
            Principal principal) {
        log.info("PUT /expedientes/{}/asignacion - usuario actor: {} - usuario destino: {}",
                id, principal.getName(), dto.getUsuarioId());

        try {
            ExpedienteDTO actualizado = expedienteService.asignarExpediente(id, dto.getUsuarioId(), principal.getName());
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/gestor/expedientes/{id}/revision-administrativa/generar-resolucion
     * Persistir correcciones y avanzar el expediente a la fase de generar resolucion.
     */
    @PutMapping("/{id}/revision-administrativa/generar-resolucion")
    public ResponseEntity<ExpedienteDTO> completarRevisionAdministrativa(
            @PathVariable Long id,
            @RequestBody ExpedienteDTO dto,
            Principal principal) {
        log.info("PUT /expedientes/{}/revision-administrativa/generar-resolucion - usuario: {}",
                id, principal.getName());

        try {
            ExpedienteDTO actualizado =
                    expedienteService.completarRevisionAdministrativa(id, dto, principal.getName());
            return ResponseEntity.ok(actualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/gestor/expedientes/{id}/fase/anterior
     * Retroceder el expediente a la fase inmediatamente anterior.
     */
    @PutMapping("/{id}/fase/anterior")
    public ResponseEntity<ExpedienteDTO> retrocederFase(
            @PathVariable Long id,
            Principal principal) {
        log.info("PUT /expedientes/{}/fase/anterior - usuario: {}", id, principal.getName());

        try {
            ExpedienteDTO actualizado = expedienteService.retrocederFase(id, principal.getName());
            return ResponseEntity.ok(actualizado);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/gestor/expedientes/{id}/fase/espera-portafirmas
     * Avanzar el expediente desde GENERAR_RESOLUCION a ESPERA_PORTAFIRMAS.
     */
    @PutMapping("/{id}/fase/espera-portafirmas")
    public ResponseEntity<ExpedienteDTO> avanzarAEsperaPortafirmas(
            @PathVariable Long id,
            Principal principal) {
        log.info("PUT /expedientes/{}/fase/espera-portafirmas - usuario: {}", id, principal.getName());

        try {
            ExpedienteDTO actualizado = expedienteService.avanzarAEsperaPortafirmas(id, principal.getName());
            return ResponseEntity.ok(actualizado);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/gestor/expedientes/{id}/fase/visto-bueno/aprobar
     * Aprobar el expediente en fase de Visto Bueno y avanzar a la siguiente fase.
     */
    @PutMapping("/{id}/fase/visto-bueno/aprobar")
    public ResponseEntity<ExpedienteDTO> aprobarVistoBueno(
            @PathVariable Long id,
            Principal principal) {
        log.info("PUT /expedientes/{}/fase/visto-bueno/aprobar - usuario: {}", id, principal.getName());

        try {
            ExpedienteDTO actualizado = expedienteService.aprobarVistoBueno(id, principal.getName());
            return ResponseEntity.ok(actualizado);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PUT /api/gestor/expedientes/{id}/fase/visto-bueno/rechazar
     * Rechazar el expediente en fase de Visto Bueno, volver a revision administrativa y eliminar documentos.
     */
    @PutMapping("/{id}/fase/visto-bueno/rechazar")
    public ResponseEntity<ExpedienteDTO> rechazarVistoBueno(
            @PathVariable Long id,
            Principal principal) {
        log.info("PUT /expedientes/{}/fase/visto-bueno/rechazar - usuario: {}", id, principal.getName());

        try {
            ExpedienteDTO actualizado = expedienteService.rechazarVistoBueno(id, principal.getName());
            return ResponseEntity.ok(actualizado);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
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
