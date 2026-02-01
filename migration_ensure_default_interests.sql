-- 1. Update all existing profiles to have all categories
UPDATE profiles
SET interests = ARRAY['POLITICS', 'SPORTS', 'ENTERTAINMENT', 'GAMING', 'TECHNOLOGY', 'FOOD', 'PHILOSOPHY', 'OTHER'];

-- 2. Alter the table to set the default value for future rows
ALTER TABLE profiles
ALTER COLUMN interests SET DEFAULT ARRAY['POLITICS', 'SPORTS', 'ENTERTAINMENT', 'GAMING', 'TECHNOLOGY', 'FOOD', 'PHILOSOPHY', 'OTHER'];
