-- ═══════════════════════════════════════════════════════════════════
-- Migración 003: Foto de portada (perfiles_negocio) + foto por servicio
-- Ejecutar en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE perfiles_negocio
  ADD COLUMN IF NOT EXISTS portada_url TEXT;

ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS foto_url TEXT;
