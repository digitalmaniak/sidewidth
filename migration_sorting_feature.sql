-- Create a view that aggregates vote statistics for each post
create or replace view post_stats_view as
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
  coalesce(v.vote_count, 0) as vote_count,
  coalesce(v.vote_average, 0) as vote_average,
  coalesce(v.vote_stddev, 0) as vote_stddev,
  coalesce(v.trending_score, 0) as trending_score
from posts p
left join (
  select
    post_id,
    count(*) as vote_count,
    avg(value) as vote_average,
    stddev(value) as vote_stddev,
    count(*) filter (where created_at > (now() - interval '24 hours')) as trending_score
  from votes
  group by post_id
) v on p.id = v.post_id;

-- Create an RPC function for fetching nearby posts with variable sorting
-- We use a simplified Haversine formula for distance if PostGIS is not available/assumed.
create or replace function get_nearby_posts_v2(
  user_lat float,
  user_long float,
  dist_km float,
  sort_by text,
  min_lat float, -- Optimization: rough bounding box if possible, but we'll ignore for now and just scan
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
    p.vote_average,
    p.vote_stddev,
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
    -- Secondary sort for stability
    p.created_at desc;
end;
$$;
