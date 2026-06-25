-- ============================================================
-- MIGRACIÓN RLS · Floristería Alameda
-- Pega en: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================


-- ──────────────────────────────────────────────
-- PASO 0: Función auxiliar "¿es admin?"
-- Comprueba si el usuario autenticado tiene el
-- claim personalizado role='admin' en su JWT,
-- o si su email coincide con el del propietario.
-- Edita el email si es distinto.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    (auth.jwt() ->> 'role') = 'admin'
    OR
    auth.email() = 'alvaroyasociadoss@gmail.com'
$$;


-- ──────────────────────────────────────────────
-- PASO 1: Añadir columna user_id a pedidos
-- Permite asociar un pedido a un usuario
-- autenticado si en el futuro se añade login.
-- Es nullable porque hoy los pedidos son anónimos.
-- ──────────────────────────────────────────────
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_user_id
  ON public.pedidos(user_id);


-- ──────────────────────────────────────────────
-- PASO 2: Confirmar que RLS está activo
-- (ya estaba en setup.sql, pero lo forzamos)
-- ──────────────────────────────────────────────
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos FORCE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────
-- PASO 3: Eliminar políticas antiguas inseguras
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "clientes_pueden_insertar"  ON public.pedidos;
DROP POLICY IF EXISTS "admin_puede_ver"            ON public.pedidos;
DROP POLICY IF EXISTS "admin_puede_actualizar"     ON public.pedidos;
DROP POLICY IF EXISTS "admin_puede_borrar"         ON public.pedidos;


-- ──────────────────────────────────────────────
-- PASO 4: Nuevas políticas seguras
-- ──────────────────────────────────────────────

-- 4a. INSERT
-- · Visitante anónimo: puede crear un pedido.
--   El campo user_id se fuerza a NULL (no puede
--   suplantar a otro usuario poniendo otro UUID).
-- · Usuario autenticado: solo puede insertar con
--   su propio user_id (o NULL si no quiere cuenta).
CREATE POLICY "insert_pedido_anonimo"
  ON public.pedidos
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "insert_pedido_autenticado"
  ON public.pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
  );

-- 4b. SELECT
-- · El admin ve todos los pedidos.
-- · Un usuario autenticado ve solo sus pedidos
--   (los que tienen su user_id).
-- · El rol anon no puede hacer SELECT nunca.
CREATE POLICY "select_admin_todo"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "select_cliente_sus_pedidos"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (
    NOT public.is_admin()
    AND user_id = auth.uid()
  );

-- 4c. UPDATE
-- · Solo el admin puede cambiar el estado de
--   cualquier pedido.
-- · Un cliente autenticado NO puede editar nada
--   (los pedidos se gestionan desde el panel).
CREATE POLICY "update_solo_admin"
  ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4d. DELETE
-- · Solo el admin puede borrar pedidos.
CREATE POLICY "delete_solo_admin"
  ON public.pedidos
  FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ──────────────────────────────────────────────
-- PASO 5: Revocar accesos directos a la tabla
-- que Supabase otorga por defecto
-- ──────────────────────────────────────────────
REVOKE ALL ON public.pedidos FROM anon;
REVOKE ALL ON public.pedidos FROM authenticated;

-- Re-otorgar solo lo necesario
GRANT INSERT ON public.pedidos TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.pedidos TO authenticated;


-- ──────────────────────────────────────────────
-- PASO 6: Seguridad adicional - función de
-- inserción segura para el service role
-- Úsala desde el backend/edge functions con
-- la service_role key (nunca desde el front).
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crear_pedido_anonimo(
  p_producto_nombre    TEXT,
  p_producto_precio    NUMERIC,
  p_emoji              TEXT,
  p_nombre_destinatario TEXT,
  p_telefono           TEXT,
  p_tipo_entrega       TEXT,
  p_direccion          TEXT,
  p_dedicatoria        TEXT,
  p_forma_pago         TEXT,
  p_fecha_entrega      TEXT,
  p_origen             TEXT DEFAULT 'modal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- corre con permisos del propietario, saltando RLS
AS $$
DECLARE
  nuevo_id UUID;
BEGIN
  INSERT INTO public.pedidos (
    producto_nombre, producto_precio, emoji,
    nombre_destinatario, telefono,
    tipo_entrega, direccion,
    dedicatoria, forma_pago, fecha_entrega,
    origen, user_id
  ) VALUES (
    p_producto_nombre, p_producto_precio, p_emoji,
    p_nombre_destinatario, p_telefono,
    p_tipo_entrega, p_direccion,
    p_dedicatoria, p_forma_pago, p_fecha_entrega,
    p_origen, auth.uid()  -- NULL si anónimo
  )
  RETURNING id INTO nuevo_id;

  RETURN nuevo_id;
END;
$$;

-- Permitir al rol anon llamar a la función
GRANT EXECUTE ON FUNCTION public.crear_pedido_anonimo TO anon, authenticated;


-- ──────────────────────────────────────────────
-- VERIFICACIÓN (ejecuta esto después para
-- confirmar que todo quedó bien)
-- ──────────────────────────────────────────────
/*
-- Ver políticas activas:
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pedidos'
ORDER BY cmd;

-- Comprobar RLS activo:
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE tablename = 'pedidos';

-- Ver columnas actuales:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;
*/
