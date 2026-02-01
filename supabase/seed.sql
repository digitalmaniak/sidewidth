
-- Create a test user if not exists (this might fail if auth.users is protected, usually requires service_role key)
-- Alternatively, we can insert into 'profiles' directly if we have a valid user ID or if we just want data without valid auth links (might break RLS if not careful).
-- Best approach for specific test data: Insert into public tables, linking to a 'system' user or similar.

-- First, let's create a dummy profile ID to use for these posts.
-- We'll use a specific UUID so we can reference it.
DO $$
DECLARE
  dummy_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- 1. Insert into auth.users (REQUIRED for foreign key constraint on profiles)
  -- We use raw insert to bypass auth machinery for testing
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    dummy_user_id,
    'authenticated',
    'authenticated',
    'test@example.com',
    '$2a$10$abcdefghijklmnopqrstuvwxyz', -- Dummy hash
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert profile if not exists
  INSERT INTO public.profiles (id, karma)
  VALUES (dummy_user_id, 100)
  ON CONFLICT (id) DO NOTHING;

  -- 3. Insert Posts around Englewood Cliffs, NJ (40.8929, -73.9557)
  -- 1. Very close (0.5km)
  INSERT INTO public.posts (created_by, side_a, side_b, category, lat, long, location_name)
  VALUES (dummy_user_id, 'Deep Dish', 'Thin Crust', 'FOOD', 40.8930, -73.9560, 'Englewood Cliffs Center');

  -- 2. Close (2km)
  INSERT INTO public.posts (created_by, side_a, side_b, category, lat, long, location_name)
  VALUES (dummy_user_id, 'React', 'Vue', 'TECHNOLOGY', 40.9100, -73.9600, 'Tenafly Tech Hub');

  -- 3. Medium (5km) - Fort Lee
  INSERT INTO public.posts (created_by, side_a, side_b, category, lat, long, location_name)
  VALUES (dummy_user_id, 'Cats', 'Dogs', 'OTHER', 40.8509, -73.9701, 'Fort Lee Park');

  -- 4. Medium (8km) - Hackensack
  INSERT INTO public.posts (created_by, side_a, side_b, category, lat, long, location_name)
  VALUES (dummy_user_id, 'Morning', 'Night', 'OTHER', 40.8859, -74.0435, 'Hackensack Commons');

  -- 5. Far (20km) - NYC/Manhattan (Should show up within 50km)
  INSERT INTO public.posts (created_by, side_a, side_b, category, lat, long, location_name)
  VALUES (dummy_user_id, 'Subway', 'Uber', 'OTHER', 40.7831, -73.9712, 'Manhattan');

  -- 6. Far (45km) - White Plains (Edge of 50km range)
  INSERT INTO public.posts (created_by, side_a, side_b, category, lat, long, location_name)
  VALUES (dummy_user_id, 'Winter', 'Summer', 'OTHER', 41.0340, -73.7629, 'White Plains');

  -- 7. Too Far (>50km) - Princeton (Should NOT show up)
  -- Approx 70km away
  INSERT INTO public.posts (created_by, side_a, side_b, category, lat, long, location_name)
  VALUES (dummy_user_id, 'Books', 'Kindle', 'OTHER', 40.3573, -74.6672, 'Princeton University');

END $$;
