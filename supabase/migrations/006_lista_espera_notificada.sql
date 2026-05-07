-- Los clientes públicos interactúan con lista_espera a través de
-- Server Actions con service_role (que bypasea RLS), por lo que no
-- se necesitan políticas adicionales. Esta migración es solo documentación.

-- Índice para buscar entradas pendientes por negocio + servicio + fecha
CREATE INDEX IF NOT EXISTS idx_lista_espera_pendientes
  ON lista_espera (negocio_id, servicio_id, fecha_deseada)
  WHERE estado = 'esperando';
