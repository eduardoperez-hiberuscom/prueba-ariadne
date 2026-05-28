CREATE SEQUENCE SEQ_PLANTILLAS_RESPUESTA START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_PLANTILLAS_DOCUMENTO START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE TABLE PLANTILLAS_RESPUESTA (
    id NUMBER(19) NOT NULL,
    codigo VARCHAR2(100) NOT NULL,
    titulo VARCHAR2(255) NOT NULL,
    contenido CLOB NOT NULL,
    activo NUMBER(1) DEFAULT 1 NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_plantillas_respuesta PRIMARY KEY (id),
    CONSTRAINT uq_plantillas_respuesta_codigo UNIQUE (codigo)
);

CREATE TABLE PLANTILLAS_DOCUMENTO (
    id NUMBER(19) NOT NULL,
    codigo VARCHAR2(100) NOT NULL,
    nombre_archivo VARCHAR2(255) NOT NULL,
    contenido_base CLOB NOT NULL,
    activo NUMBER(1) DEFAULT 1 NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_plantillas_documento PRIMARY KEY (id),
    CONSTRAINT uq_plantillas_documento_codigo UNIQUE (codigo)
);

ALTER TABLE DOCUMENTOS ADD contenido CLOB;
ALTER TABLE DOCUMENTOS ADD plantilla_codigo VARCHAR2(100);
ALTER TABLE DOCUMENTOS ADD plantilla_respuesta_codigo VARCHAR2(100);

MERGE INTO PLANTILLAS_DOCUMENTO d
USING (
    SELECT
      'RESOLUCION_TRAMITACION_CONJUNTA_DPD' AS codigo,
      'ResolucionTramitacionConjuntaDPD2.docx' AS nombre_archivo,
      TO_CLOB(q'[RESOLUCION TRAMITACION CONJUNTA

Expediente: {{NUMERO_EXPEDIENTE}}
Asunto: {{ASUNTO}}
Fecha: {{FECHA_GENERACION}}

{{RESPUESTA}}
]') AS contenido_base
    FROM dual
) s
ON (d.codigo = s.codigo)
WHEN NOT MATCHED THEN
    INSERT (id, codigo, nombre_archivo, contenido_base, activo, fecha_creacion)
    VALUES (SEQ_PLANTILLAS_DOCUMENTO.NEXTVAL, s.codigo, s.nombre_archivo, s.contenido_base, 1, SYSTIMESTAMP);

MERGE INTO PLANTILLAS_RESPUESTA p
USING (
    SELECT
      'DPD_INF1' AS codigo,
      'DPD - INF1. ALTAS pero no varia informacion inscrita (solo fecha designacion)' AS titulo,
      TO_CLOB(q'[Se ha comprobado que su entidad ya se encontraba registrada como DPD para la/s entidad/es sobre las que ahora comunican ALTA/S, es decir, ya constan incluidos en la lista prevista en el articulo 34.4 de la Ley Organica 3/2018, de 5 de diciembre, de Proteccion de Datos Personales y garantia de los derechos digitales.

Ademas, no se ha observado variacion respecto de la informacion inicialmente comunicada salvo que ahora se ha indicado una nueva "Fecha de designacion del DPD" coincidente con la fecha en la que se ha realizado el envio de la comunicacion.

Por lo tanto, se le informa de que se va a cancelar la nueva comunicacion de alta para evitar su duplicidad con la informacion previamente incluida en la lista de delegados para la/s entidad/es afectada/s.]') AS contenido
    FROM dual
    UNION ALL
    SELECT
      'DPD_INF2',
      'DPD - INF2. ALTA o SUPRES. cuando solicitante ha equivocado formulario',
      TO_CLOB(q'[Le informamos:

La/s comunicacion/es que esta realizando solicita/n el alta/la supresion del/los delegado/s de proteccion de datos de la/s entidad/es arriba detalla/s.

En este sentido le informamos de que de conformidad con lo dispuesto en el articulo 34.3 de la Ley Organica 3/2018, de 5 de diciembre, de Proteccion de Datos Personales y garantia de los derechos digitales, "Los responsables y encargados del tratamiento comunicaran en el plazo de diez dias a la Agencia Espanola de Proteccion de Datos o, en su caso, a las autoridades autonomicas de proteccion de datos, las designaciones, nombramientos y ceses de los delegados de proteccion de datos tanto en los supuestos en que se encuentren obligadas a su designacion como en el caso en que sea voluntaria".

En el entendimiento de que ha empleado de forma equivocada el formulario para la comunicacion de los delegados de proteccion de datos y de que usted no representa a la/s entidad/es indicada/s le informamos de que su/s comunicacion/es de alta/supresion va/n a ser cancelada/s.

La Agencia Espanola de Proteccion de Datos tiene publicado en su pagina web informacion detallada de como realizar el ejercicio de sus derechos delante de cada uno de los responsables.

Ademas, le informamos de que la lista de Delegados de Proteccion de Datos comunicados a la AEPD por los responsables o encargados del tratamiento puede ser consultada a traves de este enlace:

https://sedeaepd.gob.es/sede-electronica-web/vistas/infoSede/consultaDPD.jsf

Por ultimo, le informamos de que si desea presentar una reclamacion ante la Agencia Espanola de Proteccion de Datos, la Agencia tiene publicado en su pagina web informacion detallada sobre sus areas de actuacion para atender a los ciudadanos.

Con respecto a la presentacion de reclamaciones se le informa de que se encuentra disponible el formulario de presentacion de reclamaciones en la Sede Electronica de la Web de la Agencia.]')
    FROM dual
    UNION ALL
    SELECT
      'DPD_INF5',
      'DPD - INF5. ALTAS entidades ambito APDCAT',
      TO_CLOB(q'[Respecto a su comunicacion de alta para la/s entidad/es y DPD arriba indicados, deberan tener en cuenta las siguientes consideraciones:

El articulo 37.7 del Reglamento General de Proteccion de Datos exige comunicar a la autoridad de control la designacion de Delegados de Proteccion de Datos (DPD). A este respecto se pronuncia igualmente la Ley Organica 3/2018, de 5 diciembre, de Proteccion de Datos Personales y garantia de los derechos digitales (LOPDGDD), que, en su articulo 34.3 establece que "los responsables y encargados del tratamiento comunicaran en el plazo de diez dias a la Agencia Espanola de Proteccion de Datos o, en su caso, a las autoridades autonomicas de proteccion de datos, las designaciones, nombramientos y ceses de los delegados de proteccion de datos [...]"

Por otra parte, la Ley 32/2010, de 1 de octubre, establece que la Autoridad Catalana de Proteccion de Datos ejerce su autoridad de control sobre los tratamientos de datos personales llevados a cabo por las administraciones publicas del ambito territorial de la Comunidad Autonoma de Cataluna, asi como las restantes entidades y personas juridicas descritas en el articulo 3 de la citada Ley 32/2010.

Por lo tanto, en el entendimiento de que dicha/s entidad/es estaria/n incluida/s en el ambito competencial de la Autoridad Catalana de Proteccion de Datos, la presente solicitud de alta se va a cancelar puesto que las comunicaciones relativas a nombramientos y ceses de delegados de proteccion de datos, han de dirigirse a dicha autoridad a traves de su correspondiente formulario.

No obstante lo anterior, dado que se ha producido el cese del anterior DPD designado para <PONER NOMBRE DE LA ENTIDAD> que a dia de hoy figura anotado en la lista de Delegados que mantiene esta Agencia, deberan de realizar una comunicacion de supresion del mismo a traves del formulario electronico "Comunicacion del Delegado de Proteccion de Datos", disponible en la Sede Electronica de la Agencia.]')
    FROM dual
    UNION ALL
    SELECT
      'DPD_INF6',
      'DPD - INF6. ALTAS entidades ambito AVPD',
      TO_CLOB(q'[Respecto a su comunicacion de alta para la/s entidad/es y DPD arriba indicados, deberan tener en cuenta las siguientes consideraciones:

El articulo 34.3 de la Ley Organica 3/2018, de 5 diciembre, de Proteccion de Datos Personales y garantia de los derechos digitales (LOPDGDD), establece que "los responsables y encargados del tratamiento comunicaran en el plazo de diez dias a la Agencia Espanola de Proteccion de Datos o, en su caso, a las autoridades autonomicas de proteccion de datos, las designaciones, nombramientos y ceses de los delegados de proteccion de datos [...]"

Por otra parte, las Administraciones Publicas, Organismos y Entidades comprendidos en el ambito de aplicacion de la Ley del Parlamento Vasco 2/2004, de 25 de febrero, estan obligados a designar dicho DPD y comunicarlo a la Agencia Vasca de Proteccion de Datos, como Autoridad de Control en materia de Proteccion de Datos en la Comunidad Autonoma de Euskadi.

Por lo tanto, en el entendimiento de que la/s indicada/s entidad/es estaria/n incluida/s en el ambito competencial de la Agencia Vasca de Proteccion de Datos, la presente solicitud de alta se va a cancelar puesto que las comunicaciones relativas a nombramientos y ceses de delegados de proteccion de datos, han de dirigirse a dicha autoridad a traves de su correspondiente Formulario de Notificacion de Delegados de Proteccion de Datos.

No obstante lo anterior, dado que se ha producido el cese del anterior DPD designado para <PONER NOMBRE DE LA ENTIDAD> que a dia de hoy figura anotado en la lista de Delegados que mantiene esta Agencia, deberan de realizar una comunicacion de supresion del mismo a traves del formulario electronico "Comunicacion del Delegado de Proteccion de Datos", disponible en la Sede Electronica de la Agencia.]')
    FROM dual
) s
ON (p.codigo = s.codigo)
WHEN NOT MATCHED THEN
    INSERT (id, codigo, titulo, contenido, activo, fecha_creacion)
    VALUES (SEQ_PLANTILLAS_RESPUESTA.NEXTVAL, s.codigo, s.titulo, s.contenido, 1, SYSTIMESTAMP);