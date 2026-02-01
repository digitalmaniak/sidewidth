-- Update distinct categories in posts table
update posts
set category = upper(category);

-- Update distinct categories in profiles table (interests array)
-- This query unnests the array, uppercases each element, and aggregates them back into an array.
update profiles
set interests = (
  select array_agg(upper(elem))
  from unnest(interests) as elem
)
where interests is not null;
