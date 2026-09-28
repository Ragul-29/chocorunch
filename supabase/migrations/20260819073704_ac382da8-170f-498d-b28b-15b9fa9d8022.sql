REVOKE EXECUTE ON FUNCTION public.award_choco_points(text, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_choco_points(text, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_choco_points(text, numeric) TO authenticated;