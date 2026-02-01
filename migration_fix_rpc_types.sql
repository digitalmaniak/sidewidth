-- Fix RPC return types to match view types (cast numeric to float)
create or replace function get_nearby_posts_v2(
  user_lat float,
  user_long float,
  dist_km float,
  sort_by text,
  min_lat float,
  max_lat float,
  min_long float,
  max_long float
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
  vote_count bigint,
  vote_average float,
  vote_stddev float,
  trending_score bigint,
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
    p.vote_count,
    p.vote_average::float,  -- CAST to float
    p.vote_stddev::float,   -- CAST to float
    p.trending_score,
    (
      6371000 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) *
        cos(radians(p.long) - radians(user_long)) +
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) as dist_meters
  from post_stats_view p
  where
    p.lat is not null
    and p.long is not null
    and (
      6371000 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) *
        cos(radians(p.long) - radians(user_long)) +
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= (dist_km * 1000)
  order by
    case when sort_by = 'latest' then p.created_at end desc,
    case when sort_by = 'trending' then p.trending_score end desc,
    case when sort_by = 'divided' then p.vote_stddev end desc,
    case when sort_by = 'consensus' then p.vote_stddev end asc,
    p.created_at desc;
end;
$$;
