package com.example.expedientes.bean;

import com.example.expedientes.dto.ExpedienteDTO;
import com.example.expedientes.service.ExpedienteService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import jakarta.annotation.PostConstruct;
import jakarta.faces.application.FacesMessage;
import jakarta.faces.context.FacesContext;
import java.io.Serializable;

@Component("crearExpedienteBean")
@RequestScope
public class CrearExpedienteBean implements Serializable {

    @Autowired
    private ExpedienteService expedienteService;

    @Getter
    @Setter
    private String asunto;

    @Getter
    @Setter
    private String tipo;

    @Getter
    @Setter
    private String procedimiento;

    @Getter
    @Setter
    private String descripcion;

    @Getter
    private ExpedienteDTO creado;

    @PostConstruct
    public void init() {
        tipo = "REQUERIMIENTO";
        procedimiento = "REQUERIMIENTO_GENERICO";
    }

    public String guardar() {
        ExpedienteDTO dto = ExpedienteDTO.builder()
                .asunto(asunto)
                .tipo(tipo)
                .procedimiento(procedimiento)
                .descripcion(descripcion)
                .build();

        creado = expedienteService.crearExpediente(dto, "admin.ldap");

        FacesContext.getCurrentInstance().addMessage(null,
                new FacesMessage(FacesMessage.SEVERITY_INFO, "Expediente creado", creado.getNumeroExpediente()));

        limpiar();
        return "/expedientes/list?faces-redirect=true";
    }

    public String cancelar() {
        limpiar();
        return "/expedientes/list?faces-redirect=true";
    }

    private void limpiar() {
        asunto = null;
        tipo = "REQUERIMIENTO";
        procedimiento = "REQUERIMIENTO_GENERICO";
        descripcion = null;
    }
}
