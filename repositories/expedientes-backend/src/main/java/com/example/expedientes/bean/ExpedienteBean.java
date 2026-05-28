package com.example.expedientes.bean;

import com.example.expedientes.dto.ExpedienteDTO;
import com.example.expedientes.service.ExpedienteService;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.faces.view.ViewScoped;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Component("expedienteBean")
@ViewScoped
public class ExpedienteBean implements Serializable {

    @Autowired
    private ExpedienteService expedienteService;

    @Getter
    private List<ExpedienteDTO> expedientes = new ArrayList<>();

    @Getter
    private String filtro = "";

    @Getter
    private long totalExpedientes;

    @Getter
    private long abiertos;

    @Getter
    private long enTramitacion;

    @Getter
    private long cerrados;

    @PostConstruct
    public void init() {
        cargar();
    }

    public void cargar() {
        List<ExpedienteDTO> todos = expedienteService
                .listarExpedientes(PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "fechaCreacion")))
                .getContent();

        this.totalExpedientes = todos.size();
        this.abiertos = todos.stream().filter(this::esAbierto).count();
        this.enTramitacion = todos.stream().filter(this::esEnTramitacion).count();
        this.cerrados = todos.stream().filter(this::esCerrado).count();

        if (filtro == null || filtro.trim().isEmpty()) {
            this.expedientes = todos;
            return;
        }

        String texto = filtro.trim().toLowerCase();
        this.expedientes = new ArrayList<>();
        for (ExpedienteDTO expediente : todos) {
            if (contiene(expediente, texto)) {
                this.expedientes.add(expediente);
            }
        }
    }

    public void limpiarFiltro() {
        this.filtro = "";
        cargar();
    }

    public String getEstadoClass(ExpedienteDTO expediente) {
        if (expediente == null || expediente.getEstado() == null) {
            return "estado-pill estado-neutral";
        }

        String estado = expediente.getEstado().toUpperCase();
        if (estado.contains("INICIAL")) {
            return "estado-pill estado-inicial";
        }
        if (estado.contains("TRAMITACION")) {
            return "estado-pill estado-tramitacion";
        }
        if (estado.contains("CERRADO")) {
            return "estado-pill estado-cerrado";
        }
        if (estado.contains("FIRM")) {
            return "estado-pill estado-firmado";
        }
        return "estado-pill estado-neutral";
    }

    private boolean contiene(ExpedienteDTO expediente, String texto) {
        return safe(expediente.getNumeroExpediente()).contains(texto)
                || safe(expediente.getAsunto()).contains(texto)
                || safe(expediente.getTipo()).contains(texto)
                || safe(expediente.getEstado()).contains(texto)
                || safe(expediente.getProcedimiento()).contains(texto);
    }

    private boolean esAbierto(ExpedienteDTO expediente) {
        String estado = safe(expediente.getEstado());
        return estado.contains("INICIAL") || estado.contains("PENDIENTE");
    }

    private boolean esEnTramitacion(ExpedienteDTO expediente) {
        String estado = safe(expediente.getEstado());
        return estado.contains("TRAMITACION");
    }

    private boolean esCerrado(ExpedienteDTO expediente) {
        String estado = safe(expediente.getEstado());
        return estado.contains("CERRADO") || estado.contains("FIRMADO");
    }

    private String safe(String value) {
        return value == null ? "" : value.toLowerCase();
    }
}