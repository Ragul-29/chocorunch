ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;

CREATE TABLE public.birthday_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL,
  order_code text,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);

GRANT SELECT, INSERT ON public.birthday_redemptions TO authenticated;
GRANT ALL ON public.birthday_redemptions TO service_role;

ALTER TABLE public.birthday_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own birthday redemptions"
ON public.birthday_redemptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own birthday redemptions"
ON public.birthday_redemptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);