ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.award_choco_points(_order_code text, _eligible_amount numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _pts integer;
  _existing integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT points_earned INTO _existing
  FROM public.orders
  WHERE order_code = _order_code AND user_id = _uid
  FOR UPDATE;

  IF _existing IS NULL THEN
    RETURN 0; -- no such order for this user
  END IF;

  IF _existing > 0 THEN
    RETURN 0; -- already awarded
  END IF;

  _pts := floor(GREATEST(_eligible_amount, 0) / 100)::int * 10;

  IF _pts = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.orders SET points_earned = _pts
  WHERE order_code = _order_code AND user_id = _uid;

  UPDATE public.profiles SET choco_points = choco_points + _pts, updated_at = now()
  WHERE id = _uid;

  RETURN _pts;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_choco_points(text, numeric) TO authenticated;