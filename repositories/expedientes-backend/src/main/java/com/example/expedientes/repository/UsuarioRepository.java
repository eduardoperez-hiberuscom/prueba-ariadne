
package com.example.expedientes.repository;

import com.example.expedientes.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUid(String uid);
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByRol(String rol);
}
