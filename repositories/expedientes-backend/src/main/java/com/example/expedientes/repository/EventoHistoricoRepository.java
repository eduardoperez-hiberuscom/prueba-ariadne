package com.example.expedientes.repository;

import com.example.expedientes.entity.EventoHistorico;
import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface EventoHistoricoRepository extends JpaRepository<EventoHistorico, Long> {

    List<EventoHistorico> findByExpediente(Expediente expediente);

    @Query("SELECT e FROM EventoHistorico e WHERE e.expediente = :expediente ORDER BY e.timestamp DESC")
    List<EventoHistorico> findByExpedienteOrderByTimestampDesc(@Param("expediente") Expediente expediente);

    List<EventoHistorico> findByUsuario(Usuario usuario);
    
}
