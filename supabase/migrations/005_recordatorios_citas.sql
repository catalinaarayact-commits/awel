-- Tracking de recordatorios enviados para evitar duplicados
ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS recordatorio_24h_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recordatorio_2h_enviado  BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice para que el CRON encuentre citas pendientes rápido
CREATE INDEX IF NOT EXISTS idx_citas_recordatorio_24h
  ON citas (fecha_hora_inicio)
  WHERE recordatorio_24h_enviado = FALSE
    AND estado IN ('pendiente', 'confirmada');

CREATE INDEX IF NOT EXISTS idx_citas_recordatorio_2h
  ON citas (fecha_hora_inicio)
  WHERE recordatorio_2h_enviado = FALSE
    AND estado IN ('pendiente', 'confirmada');
