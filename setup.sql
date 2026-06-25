-- ============================================================
-- FLORISTERÍA ALAMEDA · Setup Supabase
-- Pega este SQL en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),

  -- Producto
  producto_nombre TEXT         NOT NULL,
  producto_precio NUMERIC(10,2) NOT NULL,
  emoji           TEXT         DEFAULT '🌸',
  productos       JSONB,          -- array de items (pedidos desde el carrito)
  total           NUMERIC(10,2),

  -- Destinatario
  nombre_destinatario TEXT     NOT NULL,
  telefono            TEXT     NOT NULL,
  fecha_entrega       TEXT,

  -- Entrega
  tipo_entrega  TEXT  DEFAULT 'domicilio'  CHECK (tipo_entrega  IN ('domicilio','tienda')),
  direccion     TEXT,

  -- Extras
  dedicatoria  TEXT,
  forma_pago   TEXT  CHECK (forma_pago IN ('Bizum','Tarjeta','PayPal')),

  -- Estado
  estado  TEXT  DEFAULT 'pendiente'  CHECK (estado IN ('pendiente','completado','cancelado')),
  origen  TEXT  DEFAULT 'modal'      CHECK (origen IN ('modal','carrito'))
);

-- 2. Activar Row Level Security
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 3. Política INSERT: cualquier visitante puede crear un pedido
CREATE POLICY "clientes_pueden_insertar" ON pedidos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 4. Política SELECT: solo el admin autenticado puede ver pedidos
CREATE POLICY "admin_puede_ver" ON pedidos
  FOR SELECT TO authenticated
  USING (true);

-- 5. Política UPDATE: solo el admin puede cambiar el estado
CREATE POLICY "admin_puede_actualizar" ON pedidos
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Política DELETE: solo el admin puede borrar
CREATE POLICY "admin_puede_borrar" ON pedidos
  FOR DELETE TO authenticated
  USING (true);

-- 7. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha  ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
