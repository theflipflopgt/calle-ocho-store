-- MANUAL ONE-TIME CLEANUP ONLY.
-- Use this only while every existing order is a test order.
-- It restores inventory for orders that have not already released stock,
-- removes return requests that block deletion, deletes test inventory movement history,
-- and then deletes all orders.
-- DO NOT add this file to the automatic migration chain.

BEGIN;

CREATE TEMP TABLE _test_orders ON COMMIT DROP AS
SELECT id
FROM public.orders;

DO $$
DECLARE
  v_order_id UUID;
BEGIN
  FOR v_order_id IN
    SELECT o.id
    FROM public.orders o
    JOIN _test_orders t ON t.id = o.id
    WHERE o.inventory_released_at IS NULL
  LOOP
    PERFORM public.release_order_inventory(
      v_order_id,
      'cancellation',
      'Limpieza manual de pedidos de prueba',
      NULL
    );
  END LOOP;
END
$$;

-- return_requests uses ON DELETE RESTRICT, so remove test requests first.
DELETE FROM public.return_requests
WHERE order_id IN (SELECT id FROM _test_orders);

-- Remove the audit movements that belonged only to these test sales/returns.
DELETE FROM public.inventory_movements
WHERE order_id IN (SELECT id FROM _test_orders);

-- Dependent rows with CASCADE will be removed automatically; SET NULL references are preserved.
DELETE FROM public.orders
WHERE id IN (SELECT id FROM _test_orders);

COMMIT;

-- Verification
SELECT count(*) AS remaining_orders FROM public.orders;
