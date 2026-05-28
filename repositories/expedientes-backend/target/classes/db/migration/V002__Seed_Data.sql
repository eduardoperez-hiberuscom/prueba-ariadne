-- Flyway Migration V002: Seed Data
-- Idempotent seed for local/dev environments

-- USUARIOS
MERGE INTO USUARIOS u
USING (
    SELECT 'admin.ldap' AS user_uid, 'Administrador' AS nombre, 'admin@expedientes.local' AS email, 'ADMIN' AS rol FROM dual
    UNION ALL
    SELECT 'gestor.ldap', 'Gestor Uno', 'gestor@expedientes.local', 'GESTOR' FROM dual
    UNION ALL
    SELECT 'interesado.ldap', 'Interesado Uno', 'interesado@expedientes.local', 'INTERESADO' FROM dual
) s
ON (u.user_uid = s.user_uid)
WHEN NOT MATCHED THEN
    INSERT (id, user_uid, nombre, email, rol, activo, created_at)
    VALUES (SEQ_USUARIOS.NEXTVAL, s.user_uid, s.nombre, s.email, s.rol, 1, SYSTIMESTAMP);

-- EXPEDIENTES
MERGE INTO EXPEDIENTES e
USING (
    SELECT
        '20260520-00001' AS numero_expediente,
        'Requerimiento de informacion' AS asunto,
        'REQUERIMIENTO' AS tipo,
        'INICIAL' AS estado,
        'REQUERIMIENTO_GENERICO' AS procedimiento,
        'Expediente semilla 1' AS descripcion,
        'interesado.ldap' AS interesado_uid,
        'gestor.ldap' AS asignado_uid
    FROM dual
    UNION ALL
    SELECT
        '20260520-00002',
        'Solicitud de licencia',
        'LICENCIA',
        'EN_TRAMITACION',
        'LICENCIAS',
        'Expediente semilla 2',
        'interesado.ldap',
        'gestor.ldap'
    FROM dual
) s
ON (e.numero_expediente = s.numero_expediente)
WHEN NOT MATCHED THEN
    INSERT (
        id,
        numero_expediente,
        asunto,
        tipo,
        estado,
        procedimiento,
        descripcion,
        interesado_id,
        asignado_a_id,
        version,
        fecha_creacion,
        fecha_actualizacion,
        deleted_at
    )
    VALUES (
        SEQ_EXPEDIENTES.NEXTVAL,
        s.numero_expediente,
        s.asunto,
        s.tipo,
        s.estado,
        s.procedimiento,
        s.descripcion,
        (SELECT id FROM USUARIOS WHERE user_uid = s.interesado_uid),
        (SELECT id FROM USUARIOS WHERE user_uid = s.asignado_uid),
        1,
        SYSTIMESTAMP,
        SYSTIMESTAMP,
        NULL
    );

-- ACTUACIONES
INSERT INTO ACTUACIONES (id, expediente_id, tipo, estado, asignado_a_id, fecha_inicio, fecha_fin)
SELECT
    SEQ_ACTUACIONES.NEXTVAL,
    e.id,
    'REVISION_INICIAL',
    'ABIERTA',
    (SELECT id FROM USUARIOS WHERE user_uid = 'gestor.ldap'),
    SYSTIMESTAMP,
    NULL
FROM EXPEDIENTES e
WHERE e.numero_expediente = '20260520-00001'
  AND NOT EXISTS (
      SELECT 1
      FROM ACTUACIONES a
      WHERE a.expediente_id = e.id
        AND a.tipo = 'REVISION_INICIAL'
  );

-- DOCUMENTOS
INSERT INTO DOCUMENTOS (
    id,
    expediente_id,
    actuacion_id,
    tipo,
    version_doc,
    estado,
    ruta_archivo,
    tamanio_bytes,
    id_portafirmas,
    certificado_firmante,
    fecha_firma,
    razon_rechazo,
    version,
    fecha_creacion,
    deleted_at
)
SELECT
    SEQ_DOCUMENTOS.NEXTVAL,
    e.id,
    a.id,
    'REQUERIMIENTO',
    1,
    'GENERADO',
    '/tmp/doc-1.pdf',
    10240,
    NULL,
    NULL,
    NULL,
    NULL,
    1,
    SYSTIMESTAMP,
    NULL
FROM EXPEDIENTES e
JOIN ACTUACIONES a ON a.expediente_id = e.id
WHERE e.numero_expediente = '20260520-00001'
  AND a.tipo = 'REVISION_INICIAL'
  AND NOT EXISTS (
      SELECT 1
      FROM DOCUMENTOS d
      WHERE d.expediente_id = e.id
        AND d.version_doc = 1
        AND d.tipo = 'REQUERIMIENTO'
  );

-- EVENTOS_HISTORICO
INSERT INTO EVENTOS_HISTORICO (
    id,
    expediente_id,
    tipo_evento,
    descripcion,
    usuario_id,
    timestamp,
    ip_address,
    user_agent
)
SELECT
    SEQ_EVENTOS.NEXTVAL,
    e.id,
    'CREACION',
    'Alta de expediente semilla',
    (SELECT id FROM USUARIOS WHERE user_uid = 'gestor.ldap'),
    SYSTIMESTAMP,
    '127.0.0.1',
    'seed-script'
FROM EXPEDIENTES e
WHERE e.numero_expediente = '20260520-00001'
  AND NOT EXISTS (
      SELECT 1
      FROM EVENTOS_HISTORICO ev
      WHERE ev.expediente_id = e.id
        AND ev.tipo_evento = 'CREACION'
  );

-- NOTIFICACIONES
INSERT INTO NOTIFICACIONES (
    id,
    expediente_id,
    documento_id,
    email_destinatario,
    estado,
    intentos_realizados,
    proximo_reintento,
    mensaje_error,
    fecha_creacion,
    fecha_envio
)
SELECT
    SEQ_NOTIFICACIONES.NEXTVAL,
    e.id,
    d.id,
    'interesado@expedientes.local',
    'PENDIENTE',
    0,
    NULL,
    NULL,
    SYSTIMESTAMP,
    NULL
FROM EXPEDIENTES e
JOIN DOCUMENTOS d ON d.expediente_id = e.id
WHERE e.numero_expediente = '20260520-00001'
  AND d.version_doc = 1
  AND NOT EXISTS (
      SELECT 1
      FROM NOTIFICACIONES n
      WHERE n.expediente_id = e.id
        AND n.documento_id = d.id
  );

COMMIT;
