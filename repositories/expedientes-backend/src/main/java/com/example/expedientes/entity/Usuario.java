package com.example.expedientes.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.*;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.io.Serializable;
import java.util.List;

/**
 * Entity: Usuario (LDAP/AD)
 * Q-4: Validación contra BD corporativa
 */
@Entity
@Table(name = "USUARIOS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "usuario_seq")
    @SequenceGenerator(name = "usuario_seq", sequenceName = "SEQ_USUARIOS", allocationSize = 1)
    private Long id;

    @Column(name = "user_uid", unique = true, nullable = false, length = 100)
    private String uid;  // LDAP uid

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 50)
    private String rol;  // ADMIN, GESTOR, INTERESADO

    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "asignadoA", fetch = FetchType.LAZY)
    private List<Expediente> expedientesAsignados;

    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY)
    private List<EventoHistorico> eventos;
}

/**
 * Roles de Usuario
 */
enum RolUsuario {
    ADMIN,
    GESTOR,
    INTERESADO
}
