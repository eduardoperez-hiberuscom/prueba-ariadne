package com.example.expedientes.repository;

import com.example.expedientes.entity.PlantillaRespuesta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlantillaRespuestaRepository extends JpaRepository<PlantillaRespuesta, Long> {
    List<PlantillaRespuesta> findByActivoTrueOrderByTituloAsc();
}