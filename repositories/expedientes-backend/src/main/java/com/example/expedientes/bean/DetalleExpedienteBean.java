package com.example.expedientes.bean;

import com.example.expedientes.dto.ExpedienteDTO;
import com.example.expedientes.service.ExpedienteService;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import javax.annotation.PostConstruct;
import javax.faces.context.FacesContext;
import java.io.Serializable;

@Component("detalleExpedienteBean")
@RequestScope
public class DetalleExpedienteBean implements Serializable {

    @Autowired
    private ExpedienteService expedienteService;

    @Getter
    private ExpedienteDTO expediente;

    @Getter
    private Long id;

    @PostConstruct
    public void init() {
        String idParam = FacesContext.getCurrentInstance()
                .getExternalContext()
                .getRequestParameterMap()
                .get("id");
        if (idParam != null && !idParam.trim().isEmpty()) {
            try {
                id = Long.valueOf(idParam);
                expediente = expedienteService.obtenerExpediente(id);
            } catch (NumberFormatException ignored) {
                expediente = null;
            }
        }
    }
}
