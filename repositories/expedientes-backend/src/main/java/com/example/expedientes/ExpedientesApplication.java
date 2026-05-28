package com.example.expedientes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.statemachine.config.EnableStateMachine;

/**
 * Spring Boot application entry point.
 * Sistema de Gestión de Expedientes Administrativos
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableStateMachine
public class ExpedientesApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExpedientesApplication.class, args);
    }
}
