-- Migración 009: Campañas por clima
-- Agrega configuración de ciudad y campañas a perfiles_negocio.
-- Crea tabla de historial de campañas enviadas.

ALTER TABLE perfiles_negocio
  ADD COLUMN IF NOT EXISTS ciudad                 TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS campana_lluvia_activa  BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS campana_calor_activa   BOOLEAN     NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN perfiles_negocio.ciudad
  IS 'Ciudad usada para consultar el clima (OpenWeatherMap). Ej: "Santiago,CL"';
COMMENT ON COLUMN perfiles_negocio.campana_lluvia_activa
  IS 'Enviar email de campaña cuando llueve en la ciudad del negocio.';
COMMENT ON COLUMN perfiles_negocio.campana_calor_activa
  IS 'Enviar email de campaña cuando la temperatura supera 28 °C.';

-- Historial de campañas enviadas
CREATE TABLE IF NOT EXISTS campanas_clima (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id           UUID NOT NULL REFERENCES perfiles_negocio(id) ON DELETE CASCADE,
  tipo_clima           TEXT NOT NULL CHECK (tipo_clima IN ('lluvia', 'calor')),
  ciudad               TEXT NOT NULL,
  temp_c               NUMERIC(5,2),               -- temperatura al momento del envío
  clientes_notificados INT  NOT NULL DEFAULT 0,
  enviada_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consulta de cooldown
CREATE INDEX IF NOT EXISTS idx_campanas_clima_negocio_tipo
  ON campanas_clima (negocio_id, tipo_clima, enviada_at DESC);

-- RLS
ALTER TABLE campanas_clima ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_negocio_select_campanas" ON campanas_clima
  FOR SELECT USING (
    negocio_id IN (
      SELECT id FROM perfiles_negocio WHERE user_id = auth.uid()
    )
  );
