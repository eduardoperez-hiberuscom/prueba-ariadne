
package com.example.expedientes.repository;

import com.example.expedientes.entity.Actuacion;
import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActuacionRepository extends JpaRepository<Actuacion, Long> {
    List<Actuacion> findByExpediente(Expediente expediente);
    List<Actuacion> findByAsignadoA(Usuario usuario);
}
