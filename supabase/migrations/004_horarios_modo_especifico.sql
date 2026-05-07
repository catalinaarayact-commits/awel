-- Agrega soporte para horarios específicos (lista fija de slots) además del modo rango
ALTER TABLE horarios_atencion
  ADD COLUMN IF NOT EXISTS modo TEXT NOT NULL DEFAULT 'rango'
    CHECK (modo IN ('rango', 'especifico')),
  ADD COLUMN IF NOT EXISTS slots_especificos JSONB DEFAULT NULL;

COMMENT ON COLUMN horarios_atencion.modo IS
  '''rango'': se generan slots automáticos entre hora_apertura y hora_cierre. '
  '''especifico'': sólo los horarios listados en slots_especificos están disponibles.';

COMMENT ON COLUMN horarios_atencion.slots_especificos IS
  'Array de strings "HH:mm" cuando modo = ''especifico''. NULL cuando modo = ''rango''.';
