-- =============================================================================
-- AWEL - Plataforma SaaS para Centros de Wellness y Belleza
-- Schema: MVP v1.0
-- Base de datos: Supabase (PostgreSQL)
--
-- NOTA DE ZONA HORARIA:
-- Todos los timestamps se almacenan en UTC.
-- La lógica de aplicación es responsable de convertir a la zona horaria de Chile:
--   - Horario de Invierno: UTC-4 (America/Santiago)
--   - Horario de Verano:  UTC-3 (America/Santiago con DST)
-- Usar siempre `AT TIME ZONE 'America/Santiago'` en queries de presentación.
-- =============================================================================


-- =============================================================================
-- TIPOS ENUM
-- =============================================================================

CREATE TYPE rol_usuario AS ENUM ('superadmin', 'admin_negocio');
CREATE TYPE estado_cuenta AS ENUM ('trial', 'activo', 'suspendido');
CREATE TYPE estado_cita AS ENUM ('pendiente', 'confirmada', 'completada', 'cancelada');
CREATE TYPE estado_espera AS ENUM ('esperando', 'notificado', 'confirmado', 'cancelado');


-- =============================================================================
-- 1. ROLES DE USUARIO
-- Extiende auth.users de Supabase con un rol de aplicación.
-- =============================================================================

CREATE TABLE roles_usuario (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role        rol_usuario NOT NULL DEFAULT 'admin_negocio',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles_usuario IS 'Extiende auth.users con roles de aplicación. Un usuario puede ser superadmin o admin de un negocio.';


-- =============================================================================
-- 2. PERFILES DE NEGOCIO
-- Un negocio por cuenta admin_negocio.
-- =============================================================================

CREATE TABLE perfiles_negocio (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_negocio                  TEXT NOT NULL,
    slug                            TEXT NOT NULL UNIQUE,
    logo_url                        TEXT,
    color_primario                  TEXT DEFAULT '#6366f1',
    estado_cuenta                   estado_cuenta NOT NULL DEFAULT 'trial',
    fecha_vencimiento_suscripcion   DATE,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT slug_formato CHECK (slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE perfiles_negocio IS 'Perfil y configuración de cada negocio registrado en la plataforma.';
COMMENT ON COLUMN perfiles_negocio.slug IS 'Identificador único para URL pública del negocio (ej: /b/mi-spa).';
COMMENT ON COLUMN perfiles_negocio.estado_cuenta IS 'Gestionado manualmente por el superadmin. trial→activo o trial→suspendido.';


-- =============================================================================
-- 3. HORARIOS DE ATENCIÓN
-- Horarios base semanales del negocio (no del staff).
-- =============================================================================

CREATE TABLE horarios_atencion (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id      UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    dia_semana      SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    hora_apertura   TIME NOT NULL,
    hora_cierre     TIME NOT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT horario_valido CHECK (hora_apertura < hora_cierre),
    CONSTRAINT horario_unico UNIQUE (negocio_id, dia_semana)
);

COMMENT ON COLUMN horarios_atencion.dia_semana IS '1=Lunes, 2=Martes, ..., 7=Domingo (ISO 8601).';


-- =============================================================================
-- 4. STAFF (PROFESIONALES)
-- Profesionales que atienden en el centro. NO tienen acceso al sistema (no son auth.users).
-- =============================================================================

CREATE TABLE staff (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id  UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    nombre      TEXT NOT NULL,
    email       TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE staff IS 'Profesionales del centro. No tienen acceso al panel de administración.';


-- =============================================================================
-- 5. SERVICIOS
-- Catálogo de servicios ofrecidos por el negocio.
-- =============================================================================

CREATE TABLE servicios (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id          UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    nombre              TEXT NOT NULL,
    descripcion         TEXT,
    duracion_minutos    INTEGER NOT NULL CHECK (duracion_minutos > 0),
    precio              NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN servicios.precio IS 'Precio en CLP (pesos chilenos). Sin decimales en práctica, pero NUMERIC permite consistencia.';


-- =============================================================================
-- 6. SERVICIOS_STAFF (TABLA PIVOTE)
-- Relación many-to-many: qué profesional realiza qué servicio.
-- =============================================================================

CREATE TABLE servicios_staff (
    servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    staff_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (servicio_id, staff_id)
);

COMMENT ON TABLE servicios_staff IS 'Define qué miembros del staff pueden realizar cada servicio.';


-- =============================================================================
-- 7. BLOQUEO DE FECHAS
-- Vacaciones, feriados u otras ausencias. staff_id NULL = cierra el negocio completo.
-- =============================================================================

CREATE TABLE bloqueo_fechas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id      UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    staff_id        UUID REFERENCES staff(id) ON DELETE CASCADE, -- NULL = aplica a todo el negocio
    fecha_inicio    TIMESTAMPTZ NOT NULL,
    fecha_fin       TIMESTAMPTZ NOT NULL,
    motivo          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bloqueo_fechas_validas CHECK (fecha_inicio < fecha_fin)
);

COMMENT ON COLUMN bloqueo_fechas.staff_id IS 'Si es NULL, el bloqueo aplica a todo el negocio (feriado, cierre temporal).';


-- =============================================================================
-- 8. CLIENTES
-- Base de clientes por negocio. rut es único dentro de cada negocio.
-- =============================================================================

CREATE TABLE clientes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id          UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    rut                 TEXT NOT NULL,
    nombre              TEXT NOT NULL,
    email               TEXT,
    telefono            TEXT,
    puntos_fidelidad    INTEGER NOT NULL DEFAULT 0 CHECK (puntos_fidelidad >= 0),
    notas_internas      TEXT,
    ultimo_contacto     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT rut_unico_por_negocio UNIQUE (negocio_id, rut)
);

COMMENT ON COLUMN clientes.rut IS 'RUT chileno. Único por negocio (un cliente puede existir en múltiples negocios).';
COMMENT ON COLUMN clientes.notas_internas IS 'Solo visible para el admin del negocio. Nunca exponer al cliente.';


-- =============================================================================
-- 9. CITAS
-- Reservas de clientes. Timestamps en UTC; convertir a America/Santiago en la app.
-- =============================================================================

CREATE TABLE citas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id          UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    servicio_id         UUID NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    staff_id            UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    fecha_hora_inicio   TIMESTAMPTZ NOT NULL,
    fecha_hora_fin      TIMESTAMPTZ NOT NULL,
    estado              estado_cita NOT NULL DEFAULT 'pendiente',
    notas_cliente       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cita_duracion_valida CHECK (fecha_hora_inicio < fecha_hora_fin)
);

COMMENT ON COLUMN citas.fecha_hora_inicio IS 'Almacenado en UTC. La app convierte a America/Santiago para mostrar al usuario.';
COMMENT ON COLUMN citas.fecha_hora_fin IS 'Se calcula como fecha_hora_inicio + duracion_minutos del servicio.';


-- =============================================================================
-- 10. PAGOS DE SUSCRIPCIÓN
-- Registro manual de pagos. Gestionado exclusivamente por el superadmin.
-- =============================================================================

CREATE TABLE pagos_suscripcion (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id          UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    fecha_pago          DATE NOT NULL,
    monto_pagado        NUMERIC(10, 2) NOT NULL CHECK (monto_pagado > 0),
    metodo_pago         TEXT NOT NULL, -- 'Flow', 'Transferencia', etc.
    comprobante_url     TEXT,
    notas_superadmin    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pagos_suscripcion IS 'Registro de pagos manuales de suscripción. Solo el superadmin puede insertar/editar.';


-- =============================================================================
-- 11. LISTA DE ESPERA
-- Clientes que quieren una cita cuando no hay disponibilidad.
-- =============================================================================

CREATE TABLE lista_espera (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id      UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
    cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    servicio_id     UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    fecha_deseada   DATE NOT NULL,
    estado          estado_espera NOT NULL DEFAULT 'esperando',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- 12. RESEÑAS
-- Una reseña por cita completada. Vinculada a cita para evitar duplicados.
-- =============================================================================

CREATE TABLE resenas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id         UUID NOT NULL UNIQUE REFERENCES citas(id) ON DELETE CASCADE,
    cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    calificacion    SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario      TEXT,
    visible_publico BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN resenas.visible_publico IS 'El admin decide si mostrar la reseña en el perfil público del negocio.';


-- =============================================================================
-- ÍNDICES DE RENDIMIENTO
-- =============================================================================

-- Búsqueda de clientes por RUT (operación frecuente en check-in)
CREATE INDEX idx_clientes_rut ON clientes(rut);

-- Consultas de agenda por fecha (vista de calendario)
CREATE INDEX idx_citas_fecha_hora_inicio ON citas(fecha_hora_inicio);

-- Filtrar citas por negocio (query más común en el dashboard)
CREATE INDEX idx_citas_negocio_id ON citas(negocio_id);

-- Índices adicionales de soporte para joins frecuentes
CREATE INDEX idx_citas_staff_id ON citas(staff_id);
CREATE INDEX idx_citas_cliente_id ON citas(cliente_id);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_staff_negocio_id ON staff(negocio_id);
CREATE INDEX idx_servicios_negocio_id ON servicios(negocio_id);
CREATE INDEX idx_clientes_negocio_id ON clientes(negocio_id);
CREATE INDEX idx_bloqueo_fechas_negocio_staff ON bloqueo_fechas(negocio_id, staff_id);


-- =============================================================================
-- FUNCIÓN HELPER: obtener el negocio_id del usuario autenticado
-- Usada en las políticas RLS para evitar subconsultas repetitivas.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_negocio_id_del_usuario()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM perfiles_negocio WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION es_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM roles_usuario
        WHERE id = auth.uid() AND role = 'superadmin'
    );
$$;


-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Regla general:
--   - superadmin → acceso total a todas las tablas.
--   - admin_negocio → solo accede a filas donde negocio_id = su propio negocio.
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE roles_usuario        ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_negocio     ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_atencion    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_staff      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueo_fechas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_suscripcion    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_espera         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas              ENABLE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- POLÍTICAS: roles_usuario
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a roles"
    ON roles_usuario FOR ALL
    USING (es_superadmin());

CREATE POLICY "usuario: ver su propio rol"
    ON roles_usuario FOR SELECT
    USING (id = auth.uid());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: perfiles_negocio
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a negocios"
    ON perfiles_negocio FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: ver y editar su propio perfil"
    ON perfiles_negocio FOR ALL
    USING (user_id = auth.uid());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: horarios_atencion
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a horarios"
    ON horarios_atencion FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD sus horarios"
    ON horarios_atencion FOR ALL
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: staff
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a staff"
    ON staff FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD su staff"
    ON staff FOR ALL
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: servicios
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a servicios"
    ON servicios FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD sus servicios"
    ON servicios FOR ALL
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: servicios_staff
-- Requiere join para verificar negocio_id.
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a servicios_staff"
    ON servicios_staff FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD sus asignaciones servicio-staff"
    ON servicios_staff FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM servicios s
            WHERE s.id = servicio_id
            AND s.negocio_id = get_negocio_id_del_usuario()
        )
    );


-- -----------------------------------------------------------------------------
-- POLÍTICAS: bloqueo_fechas
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a bloqueos"
    ON bloqueo_fechas FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD sus bloqueos"
    ON bloqueo_fechas FOR ALL
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: clientes
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a clientes"
    ON clientes FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD sus clientes"
    ON clientes FOR ALL
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: citas
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a citas"
    ON citas FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD sus citas"
    ON citas FOR ALL
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: pagos_suscripcion
-- Solo el superadmin puede insertar/modificar. El admin_negocio solo puede leer los suyos.
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a pagos"
    ON pagos_suscripcion FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: solo leer sus pagos"
    ON pagos_suscripcion FOR SELECT
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: lista_espera
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a lista espera"
    ON lista_espera FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD su lista de espera"
    ON lista_espera FOR ALL
    USING (negocio_id = get_negocio_id_del_usuario());


-- -----------------------------------------------------------------------------
-- POLÍTICAS: resenas
-- -----------------------------------------------------------------------------

CREATE POLICY "superadmin: acceso total a reseñas"
    ON resenas FOR ALL
    USING (es_superadmin());

CREATE POLICY "admin_negocio: CRUD sus reseñas"
    ON resenas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM citas c
            WHERE c.id = cita_id
            AND c.negocio_id = get_negocio_id_del_usuario()
        )
    );


-- =============================================================================
-- TRIGGER: updated_at automático
-- Mantiene el campo updated_at sincronizado en todas las tablas que lo tienen.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfiles_negocio_updated_at
    BEFORE UPDATE ON perfiles_negocio
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_servicios_updated_at
    BEFORE UPDATE ON servicios
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_lista_espera_updated_at
    BEFORE UPDATE ON lista_espera
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_resenas_updated_at
    BEFORE UPDATE ON resenas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- FIN DEL SCHEMA
-- =============================================================================
