-- Migración 001: Agregar campo texto_bienvenida a perfiles_negocio
-- Ejecutar en el SQL Editor de Supabase.

ALTER TABLE perfiles_negocio
  ADD COLUMN IF NOT EXISTS texto_bienvenida TEXT;

COMMENT ON COLUMN perfiles_negocio.texto_bienvenida IS
  'Texto de bienvenida visible en la página pública de reservas del negocio.';
