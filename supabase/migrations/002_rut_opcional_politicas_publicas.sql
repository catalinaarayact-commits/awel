-- ═══════════════════════════════════════════════════════════════════
-- Migración 002: RUT opcional + políticas RLS para página pública
-- Ejecutar en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Hacer rut opcional (clientes creados desde la web pública no lo tienen)
ALTER TABLE clientes
  ALTER COLUMN rut DROP NOT NULL;

ALTER TABLE clientes
  ALTER COLUMN rut SET DEFAULT NULL;

-- Ajustar constraint de unicidad: solo aplicar cuando rut NO es null
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS rut_unico_por_negocio;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_rut_negocio
  ON clientes (negocio_id, rut)
  WHERE rut IS NOT NULL;


-- 2. Políticas públicas de LECTURA (rol anon = usuario no autenticado)
-- Permiten que la página pública de reservas consulte datos sin sesión.

-- 2a. Ver perfil de negocio activo por slug
CREATE POLICY "public: ver negocio activo"
  ON perfiles_negocio FOR SELECT
  TO anon
  USING (estado_cuenta = 'activo');

-- 2b. Ver servicios activos del negocio
CREATE POLICY "public: ver servicios activos"
  ON servicios FOR SELECT
  TO anon
  USING (
    activo = true
    AND EXISTS (
      SELECT 1 FROM perfiles_negocio pn
      WHERE pn.id = negocio_id AND pn.estado_cuenta = 'activo'
    )
  );

-- 2c. Ver horarios de atención del negocio
CREATE POLICY "public: ver horarios activos"
  ON horarios_atencion FOR SELECT
  TO anon
  USING (
    activo = true
    AND EXISTS (
      SELECT 1 FROM perfiles_negocio pn
      WHERE pn.id = negocio_id AND pn.estado_cuenta = 'activo'
    )
  );

-- 2d. Ver disponibilidad (solo fecha/hora, no datos personales)
CREATE POLICY "public: ver disponibilidad citas"
  ON citas FOR SELECT
  TO anon
  USING (
    estado IN ('pendiente', 'confirmada')
    AND EXISTS (
      SELECT 1 FROM perfiles_negocio pn
      WHERE pn.id = negocio_id AND pn.estado_cuenta = 'activo'
    )
  );
