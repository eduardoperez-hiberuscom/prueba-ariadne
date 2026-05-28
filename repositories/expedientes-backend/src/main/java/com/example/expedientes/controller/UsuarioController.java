package com.example.expedientes.controller;

import com.example.expedientes.dto.UsuarioDTO;
import com.example.expedientes.service.ExpedienteService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gestor/usuarios")
@Slf4j
public class UsuarioController {

    @Autowired
    private ExpedienteService expedienteService;

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarUsuariosActivos() {
        log.info("GET /usuarios");
        return ResponseEntity.ok(expedienteService.listarUsuariosActivos());
    }
}