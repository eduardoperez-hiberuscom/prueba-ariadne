package com.example.expedientes.repository;

import com.example.expedientes.entity.PlantillaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlantillaDocumentoRepository extends JpaRepository<PlantillaDocumento, Long> {
    Optional<PlantillaDocumento> findByCodigoAndActivoTrue(String codigo);
}