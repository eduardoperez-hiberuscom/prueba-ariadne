package com.example.expedientes.repository;

import com.example.expedientes.entity.Notificacion;
import com.example.expedientes.entity.Expediente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByEstado(String estado);

    List<Notificacion> findByExpediente(Expediente expediente);

    List<Notificacion> findByProximoReintentoLessThanEqual(LocalDateTime ahora);

}
