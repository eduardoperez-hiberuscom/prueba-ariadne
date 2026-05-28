# Sistema de Gestión de Expedientes Administrativos

**Backend Java 8 + Spring Boot 2.7.14 + Oracle**

---

## 1. Introducción

Sistema modular para la gestión y automatización de procesos de negocio administrativos, con capacidad de gestión de expedientes, workflows, generación de documentos, firma electrónica e integración con Portafirmas.

---

## 2. Requisitos Previos

### Software Requerido
- Java 8 (JDK 1.8+)
- Maven 3.6+
- Oracle Database 21c+ o compatible
- Git

### Servicios Externos Requeridos
- LDAP/AD corporativo (Q-4)
- Portafirmas API (Q-1, Q-9)
- Servidor SMTP (Q-6)

---

## 3. Instalación

### 3.1 Clonar Repositorio
```bash
git clone https://git.example.com/expedientes-backend.git
cd expedientes-backend
```

### 3.2 Configurar Base de Datos

#### Crear usuario Oracle
```sql
CREATE USER expedientes IDENTIFIED BY password;
GRANT CONNECT, RESOURCE TO expedientes;
GRANT CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER TO expedientes;
```

#### Aplicar migraciones (Flyway)
```bash
mvn flyway:migrate -Dflyway.user=expedientes -Dflyway.password=password
```

### 3.3 Configurar Aplicación

Editar `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@localhost:1521:XE
    username: expedientes
    password: password

integrations:
  portafirmas:
    base-url: http://portafirmas.example.com
    api-key: YOUR_API_KEY

ldap:
  url: ldap://ldap.example.com:389
  base-dn: dc=example,dc=com
```

---

## 4. Build & Run

### 4.1 Build
```bash
mvn clean package
```

### 4.2 Run (Desarrollo)
```bash
mvn spring-boot:run
```

### 4.3 Run (WAR en Tomcat)
```bash
cp target/expedientes-administrativos-1.0.0-SNAPSHOT.war $CATALINA_HOME/webapps/
```

**Acceso**: http://localhost:8080/expedientes

---

## 5. Estructura de Proyectos

```
expedientes-backend/
├── src/main/java/com/example/expedientes/
│   ├── config/              # Configuraciones (Security, State Machine)
│   ├── controller/          # REST Controllers
│   ├── entity/              # JPA Entities
│   ├── dto/                 # Data Transfer Objects
│   ├── service/             # Business Logic
│   ├── repository/          # Spring Data JPA
│   ├── exception/           # Excepciones custom
│   ├── integration/         # Integraciones (Portafirmas, LDAP, etc.)
│   └── ExpedientesApplication.java
├── src/main/resources/
│   ├── application.yml      # Configuración
│   ├── db/migration/        # Scripts Flyway
│   └── logback-spring.xml   # Configuración logging
├── src/main/webapp/         # JSF templates
└── pom.xml                  # Maven POM
```

---

## 6. APIs REST

### 6.1 Expedientes

**Crear expediente** (RF-1)
```
POST /api/gestor/expedientes
Content-Type: application/json

{
  "asunto": "Requerimiento de información",
  "tipo": "REQUERIMIENTO",
  "descripcion": "Solicitud de acceso a expediente X",
  "procedimiento": "REQUERIMIENTO_GENERICO"
}

Response: 201 Created
{
  "id": 1,
  "numeroExpediente": "20260508-00001",
  "asunto": "...",
  "estado": "INICIAL",
  "fechaCreacion": "2026-05-08T10:30:00"
}
```

**Obtener expediente**
```
GET /api/gestor/expedientes/1

Response: 200 OK
```

**Listar expedientes**
```
GET /api/gestor/expedientes?page=0&size=10&sort=fechaCreacion,desc

Response: 200 OK
```

---

### 6.2 Documentos

**Generar documento** (RF-3)
```
POST /api/gestor/documentos?expedienteId=1&tipo=Requerimiento
Content-Type: application/json

{
  "asunto": "Valor asunto",
  "procedimiento": "Valor procedimiento"
}

Response: 201 Created (si <5MB) o 202 Accepted (si ≥5MB, async)
```

---

### 6.3 Workflows

**Iniciar workflow** (RF-2)
```
PUT /api/gestor/expedientes/1/workflow/iniciar

Response: 200 OK
{
  "estado": "EN_TRAMITACION",
  "transicion": "INICIAL -> EN_TRAMITACION"
}
```

---

## 7. Características Principales

### RF-1: Crear Expediente
✅ Generación automática de número único (YYYYMMDD-NNNNN)
✅ Asignación a gestor específico (Q-8)
✅ Seguimiento de estado inicial

### RF-2: Workflows
✅ Spring State Machine (Q-1)
✅ Transiciones configurables (Q-11)
✅ Auditoría de cambios de estado

### RF-3: Generación de Documentos
✅ Procesamiento síncrono <5MB (Q-3)
✅ Procesamiento asincrónico ≥5MB (Q-3)
✅ Versionado automático (v1, v2, v3)
✅ Almacenamiento en filesystem local (Q-2)

### RF-4/5/6: Portafirmas
✅ Integración callback + polling (Q-9)
✅ Reintentos configurables (Q-5) [2s, 4s, 8s]
✅ Estados: ENVIADO_FIRMA, FIRMADO, RECHAZADO

### RF-6: Notificaciones
✅ Email only (MVP, Q-6)
✅ Queue con reintentos (Q-5)
✅ Scheduler: procesa cada 5 min

### RF-7: Retramitación
✅ Solo admin (Q-7)
✅ Transición CERRADO → EN_TRAMITACION
✅ Auditoría completa

### RF-10: Auditoría
✅ Tabla EVENTOS_HISTORICO inmutable
✅ Tracking: usuario, IP, User-Agent, timestamp
✅ Consultas optimizadas (índices)

---

## 8. Testing

### 8.1 Unit Tests
```bash
mvn test
```

### 8.2 Integration Tests
```bash
mvn verify
```

### 8.3 Code Coverage
```bash
mvn clean test jacoco:report
# Reporte: target/site/jacoco/index.html
```

### 8.4 Load Testing
```bash
# Usar JMeter desde: tests/jmeter/
jmeter -n -t tests/jmeter/expedientes_load_test.jmx -l results.jtl
```

---

## 9. Deployment

### 9.1 Pre-Deployment Checklist
- ✅ Cobertura de tests ≥80%
- ✅ SonarQube análisis <5% debt
- ✅ Load test exitoso (100 usuarios)
- ✅ Security audit (0 vulnerabilidades críticas)
- ✅ BD migrations ejecutadas

### 9.2 Staging Deployment
```bash
mvn clean package -DskipTests
docker build -t expedientes:1.0.0 .
docker-compose -f docker-compose.staging.yml up -d
```

### 9.3 Production Deployment
```bash
# Backup BD
sqlplus expedientes/password @backup.sql

# Deploy WAR
cp target/expedientes-administrativos-1.0.0-SNAPSHOT.war $CATALINA_HOME/webapps/

# Restart Tomcat
$CATALINA_HOME/bin/shutdown.sh
$CATALINA_HOME/bin/startup.sh
```

---

## 10. Monitoring & Troubleshooting

### 10.1 Logs
```bash
tail -f /var/log/expedientes/application.log
```

### 10.2 Health Check
```bash
curl http://localhost:8080/expedientes/actuator/health
```

### 10.3 Métricas
```bash
curl http://localhost:8080/expedientes/actuator/metrics
```

---

## 11. Contacto & Soporte

- **Documentación técnica**: https://wiki.example.com/expedientes
- **Issues**: https://jira.example.com/EXPEDIENTES
- **Soporte**: expedientes-support@example.com

---

**Versión**: 1.0.0  
**Última actualización**: 2026-05-08  
**Estado**: Production Ready (Phase 2 Implementation Complete)
