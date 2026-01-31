-- Remote Procedure Call (RPC) to get posts sorted by proximity
-- Usage: supabase.rpc('get_nearby_posts', { user_lat: 40.7, user_long: -74.0, dist_km: 50 })

create or replace function get_nearby_posts(
  user_lat float,
  user_long float,
  dist_km float
)
returns table (
  id uuid,
  created_at timestamptz,
  created_by uuid,
  side_a text,
  side_b text,
  category text,
  lat float,
  long float,
  location_name text,
  dist_meters float
)
language plpgsql
as $$
begin
  return query
  select
    p.id,
    p.created_at,
    p.created_by,
    p.side_a,
    p.side_b,
    p.category,
    p.lat,
    p.long,
    p.location_name,
    (
      6371000 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(user_lat)) *
          cos(radians(p.lat)) *
          cos(radians(p.long) - radians(user_long)) +
          sin(radians(user_lat)) *
          sin(radians(p.lat))
        ))
      )
    ) as dist_meters
  from
    posts p
  where
    (
      6371000 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(user_lat)) *
          cos(radians(p.lat)) *
          cos(radians(p.long) - radians(user_long)) +
          sin(radians(user_lat)) *
          sin(radians(p.lat))
        ))
      )
    ) < (dist_km * 1000)
  order by
    dist_meters asc;
end;
$$;
