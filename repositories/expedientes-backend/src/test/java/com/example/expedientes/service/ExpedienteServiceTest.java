package com.example.expedientes.service;

import com.example.expedientes.dto.ExpedienteDTO;
import com.example.expedientes.entity.Expediente;
import com.example.expedientes.entity.EstadoExpediente;
import com.example.expedientes.repository.ExpedienteRepository;
import com.example.expedientes.repository.UsuarioRepository;
import com.example.expedientes.repository.EventoHistoricoRepository;
import com.example.expedientes.service.AuditLogger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit Test: ExpedienteService
 * RF-1: Crear expediente administrativo
 */
@ExtendWith(MockitoExtension.class)
class ExpedienteServiceTest {

    @Mock
    private ExpedienteRepository expedienteRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private EventoHistoricoRepository historicoRepository;

    @Mock
    private AuditLogger auditLogger;

    @InjectMocks
    private ExpedienteService expedienteService;

    private ExpedienteDTO expedienteDTO;

    @BeforeEach
    void setUp() {
        expedienteDTO = ExpedienteDTO.builder()
                .asunto("Requerimiento de información")
                .tipo("REQUERIMIENTO")
                .descripcion("Test expediente")
                .build();
    }

    /**
     * Test RF-1: Crear expediente con datos válidos
     * AC-1: Crear expediente administrativo con datos válidos
     */
    @Test
    void testCrearExpedienteValido() {
        // Arrange
        Expediente expediente = Expediente.builder()
                .id(1L)
                .numeroExpediente("20260508-00001")
                .asunto("Requerimiento de información")
                .tipo("REQUERIMIENTO")
                .estado(EstadoExpediente.INICIAL)
                .fechaCreacion(LocalDateTime.now())
                .build();

        when(expedienteRepository.save(any(Expediente.class))).thenReturn(expediente);

        // Act
        ExpedienteDTO resultado = expedienteService.crearExpediente(expedienteDTO, "usuario@example.com");

        // Assert
        assertNotNull(resultado);
        assertEquals("20260508-00001", resultado.getNumeroExpediente());
        assertEquals("INICIAL", resultado.getEstado());
        assertEquals("Requerimiento de información", resultado.getAsunto());
    }

    /**
     * Test AC-2: Rechazar expediente con asunto vacío
     */
    @Test
    void testCrearExpedienteConAsuntoVacio() {
        // Arrange
        ExpedienteDTO dtoConVacioAsunto = ExpedienteDTO.builder()
                .asunto("")
                .tipo("REQUERIMIENTO")
                .build();

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
                expedienteService.crearExpediente(dtoConVacioAsunto, "usuario@example.com")
        );
    }

    /**
     * Test: Obtener expediente por ID
     */
    @Test
    void testObtenerExpedienteExistente() {
        // Arrange
        Expediente expediente = Expediente.builder()
                .id(1L)
                .numeroExpediente("20260508-00001")
                .asunto("Test")
                .estado(EstadoExpediente.INICIAL)
                .build();

        when(expedienteRepository.findById(1L)).thenReturn(Optional.of(expediente));

        // Act
        ExpedienteDTO resultado = expedienteService.obtenerExpediente(1L);

        // Assert
        assertNotNull(resultado);
        assertEquals("20260508-00001", resultado.getNumeroExpediente());
    }

    /**
     * Test: Expediente no encontrado
     */
    @Test
    void testObtenerExpedienteNoExistente() {
        // Arrange
        when(expedienteRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> 
                expedienteService.obtenerExpediente(999L)
        );
    }
}
