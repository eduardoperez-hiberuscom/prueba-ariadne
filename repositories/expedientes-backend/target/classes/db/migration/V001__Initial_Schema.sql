-- Flyway Migration V001: Initial Schema
-- Database: Oracle 21c
-- Feature: Gestión de Expedientes Administrativos

-- Sequences
CREATE SEQUENCE SEQ_EXPEDIENTES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_DOCUMENTOS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_ACTUACIONES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_EVENTOS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_NOTIFICACIONES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_USUARIOS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- Table: USUARIOS (Q-4: LDAP/AD users)
CREATE TABLE USUARIOS (
    id NUMBER(19) NOT NULL,
    user_uid VARCHAR2(100) NOT NULL,
    nombre VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL,
    rol VARCHAR2(50),
    activo NUMBER(1) DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_user_uid UNIQUE (user_uid),
    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

-- Table: EXPEDIENTES (RF-1)
CREATE TABLE EXPEDIENTES (
    id NUMBER(19) NOT NULL,
    numero_expediente VARCHAR2(50) NOT NULL,
    asunto VARCHAR2(100) NOT NULL,
    tipo VARCHAR2(100),
    estado VARCHAR2(50) NOT NULL,
    procedimiento VARCHAR2(100),
    descripcion VARCHAR2(1000),
    interesado_id NUMBER,
    asignado_a_id NUMBER,
    version NUMBER(19) DEFAULT 1 NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_exp_interesado FOREIGN KEY (interesado_id) REFERENCES USUARIOS(id),
    CONSTRAINT fk_exp_asignado FOREIGN KEY (asignado_a_id) REFERENCES USUARIOS(id),
    CONSTRAINT pk_expedientes PRIMARY KEY (id),
    CONSTRAINT uq_expedientes_numero UNIQUE (numero_expediente)
);

-- Index: Búsqueda rápida expedientes
CREATE INDEX idx_exp_estado ON EXPEDIENTES(estado);
CREATE INDEX idx_exp_fecha_creacion ON EXPEDIENTES(fecha_creacion DESC);
CREATE INDEX idx_exp_interesado ON EXPEDIENTES(interesado_id);
CREATE INDEX idx_exp_asignado ON EXPEDIENTES(asignado_a_id);

-- Table: ACTUACIONES (RF-9: Múltiples actuaciones)
CREATE TABLE ACTUACIONES (
    id NUMBER(19) NOT NULL,
    expediente_id NUMBER NOT NULL,
    tipo VARCHAR2(100),
    estado VARCHAR2(50) NOT NULL,
    asignado_a_id NUMBER,
    fecha_inicio TIMESTAMP DEFAULT SYSTIMESTAMP,
    fecha_fin TIMESTAMP,
    CONSTRAINT fk_act_expediente FOREIGN KEY (expediente_id) REFERENCES EXPEDIENTES(id),
    CONSTRAINT fk_act_asignado FOREIGN KEY (asignado_a_id) REFERENCES USUARIOS(id),
    CONSTRAINT pk_actuaciones PRIMARY KEY (id)
);

CREATE INDEX idx_act_expediente ON ACTUACIONES(expediente_id);
CREATE INDEX idx_act_asignado ON ACTUACIONES(asignado_a_id);

-- Table: DOCUMENTOS (RF-3: Documentos con versionado)
CREATE TABLE DOCUMENTOS (
    id NUMBER(19) NOT NULL,
    expediente_id NUMBER NOT NULL,
    actuacion_id NUMBER,
    tipo VARCHAR2(100),
    version_doc NUMBER(10) NOT NULL,
    estado VARCHAR2(50) NOT NULL,
    ruta_archivo VARCHAR2(500) NOT NULL,
    tamanio_bytes NUMBER,
    id_portafirmas VARCHAR2(255),
    certificado_firmante VARCHAR2(500),
    fecha_firma TIMESTAMP,
    razon_rechazo VARCHAR2(500),
    version NUMBER(19) DEFAULT 1 NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_doc_expediente FOREIGN KEY (expediente_id) REFERENCES EXPEDIENTES(id),
    CONSTRAINT fk_doc_actuacion FOREIGN KEY (actuacion_id) REFERENCES ACTUACIONES(id),
    CONSTRAINT uq_id_portafirmas UNIQUE (id_portafirmas),
    CONSTRAINT pk_documentos PRIMARY KEY (id)
);

CREATE INDEX idx_doc_expediente ON DOCUMENTOS(expediente_id);
CREATE INDEX idx_doc_actuacion ON DOCUMENTOS(actuacion_id);
CREATE INDEX idx_doc_estado ON DOCUMENTOS(estado);

-- Table: EVENTOS_HISTORICO (RF-10: Auditoría inmutable)
CREATE TABLE EVENTOS_HISTORICO (
    id NUMBER(19) NOT NULL,
    expediente_id NUMBER NOT NULL,
    tipo_evento VARCHAR2(50) NOT NULL,
    descripcion VARCHAR2(500) NOT NULL,
    usuario_id NUMBER,
    timestamp TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    ip_address VARCHAR2(50),
    user_agent VARCHAR2(500),
    CONSTRAINT fk_evt_expediente FOREIGN KEY (expediente_id) REFERENCES EXPEDIENTES(id),
    CONSTRAINT fk_evt_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id),
    CONSTRAINT pk_eventos_historico PRIMARY KEY (id)
);

-- Index: Búsqueda histórico por expediente
CREATE INDEX idx_evt_expediente ON EVENTOS_HISTORICO(expediente_id);
CREATE INDEX idx_evt_timestamp ON EVENTOS_HISTORICO(timestamp DESC);
CREATE INDEX idx_evt_usuario ON EVENTOS_HISTORICO(usuario_id);

-- Table: NOTIFICACIONES (RF-6: Queue de notificaciones)
CREATE TABLE NOTIFICACIONES (
    id NUMBER(19) NOT NULL,
    expediente_id NUMBER NOT NULL,
    documento_id NUMBER,
    email_destinatario VARCHAR2(255) NOT NULL,
    estado VARCHAR2(50) NOT NULL,
    intentos_realizados NUMBER(10) DEFAULT 0 NOT NULL,
    proximo_reintento TIMESTAMP,
    mensaje_error VARCHAR2(500),
    fecha_creacion TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    fecha_envio TIMESTAMP,
    CONSTRAINT fk_notif_expediente FOREIGN KEY (expediente_id) REFERENCES EXPEDIENTES(id),
    CONSTRAINT fk_notif_documento FOREIGN KEY (documento_id) REFERENCES DOCUMENTOS(id),
    CONSTRAINT pk_notificaciones PRIMARY KEY (id)
);

-- Index: Búsqueda notificaciones pendientes
CREATE INDEX idx_notif_estado ON NOTIFICACIONES(estado);
CREATE INDEX idx_notif_reintento ON NOTIFICACIONES(proximo_reintento);
CREATE INDEX idx_notif_expediente ON NOTIFICACIONES(expediente_id);
CREATE INDEX idx_notif_documento ON NOTIFICACIONES(documento_id);

-- Commit changes
COMMIT;
