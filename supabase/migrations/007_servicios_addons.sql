-- Sub-servicios / add-ons por servicio
-- Ejemplo: Servicio "Uñas" → add-ons "Francesa", "Diseño", "Gel"

CREATE TABLE IF NOT EXISTS servicios_addon (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id      UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  negocio_id       UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
  nombre           TEXT NOT NULL,
  descripcion      TEXT,
  precio           INTEGER NOT NULL DEFAULT 0,        -- en CLP, 0 = incluido
  duracion_minutos INTEGER NOT NULL DEFAULT 0,        -- minutos extra al servicio base
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE servicios_addon ENABLE ROW LEVEL SECURITY;

-- El admin del negocio gestiona sus propios add-ons
CREATE POLICY "admin_negocio: CRUD sus addons"
  ON servicios_addon FOR ALL
  USING (negocio_id = get_negocio_id_del_usuario());

-- El público puede leer add-ons activos (para el booking flow)
CREATE POLICY "público: leer addons activos"
  ON servicios_addon FOR SELECT
  USING (activo = TRUE);

CREATE TRIGGER trg_servicios_addon_updated_at
  BEFORE UPDATE ON servicios_addon
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
