CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile, email, dob)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'mobile',
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'dob', '')::date
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;