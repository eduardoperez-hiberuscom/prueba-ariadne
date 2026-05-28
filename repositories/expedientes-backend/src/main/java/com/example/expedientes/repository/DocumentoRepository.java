package com.example.expedientes.repository;

import com.example.expedientes.entity.Documento;
import com.example.expedientes.entity.Expediente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    List<Documento> findByExpediente(Expediente expediente);
    List<Documento> findByExpedienteAndEstado(Expediente expediente, String estado);
    Optional<Documento> findByIdPortafirmas(String idPortafirmas);
}
