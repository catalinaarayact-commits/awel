-- Migración 008: Churn tracking
-- Agrega columna para registrar cuándo se envió el último email de reactivación a cada cliente.

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS ultimo_churn_email TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN clientes.ultimo_churn_email
  IS 'Timestamp del último email de reactivación enviado por el algoritmo de churn detection. NULL = nunca enviado.';

-- Índice parcial para que el CRON de churn solo escanee clientes elegibles
-- (email no nulo y sin email reciente en últimos 30 días)
CREATE INDEX IF NOT EXISTS idx_clientes_churn_elegibles
  ON clientes (negocio_id, ultimo_churn_email)
  WHERE email IS NOT NULL;
