package com.example.expedientes.repository;

import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExpedienteRepository extends JpaRepository<Expediente, Long> {

    Optional<Expediente> findByNumeroExpediente(String numeroExpediente);

    Page<Expediente> findByEstado(String estado, Pageable pageable);

    List<Expediente> findByAsignadoA(Usuario usuario);

    Page<Expediente> findByAsignadoA(Usuario usuario, Pageable pageable);

    Page<Expediente> findByAsignadoAIsNull(Pageable pageable);

    List<Expediente> findByFechaCreacionBetween(LocalDateTime inicio, LocalDateTime fin);
}