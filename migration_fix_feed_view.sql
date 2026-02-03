-- Drop the function first because it depends on the view
DROP FUNCTION IF EXISTS get_nearby_posts_v2(float, float, float, text, float, float, float, float);

-- Drop the view to allow column changes
DROP VIEW IF EXISTS post_stats_view;

-- Recreate the view with the new description column
CREATE OR REPLACE VIEW post_stats_view AS
SELECT
  p.id,
  p.created_at,
  p.created_by,
  p.side_a,
  p.side_b,
  p.category,
  p.lat,
  p.long,
  p.location_name,
  p.description,
  COALESCE(v.vote_count, 0) AS vote_count,
  COALESCE(v.vote_average, 0) AS vote_average,
  COALESCE(v.vote_stddev, 0) AS vote_stddev,
  COALESCE(v.trending_score, 0) AS trending_score
FROM posts p
LEFT JOIN (
  SELECT
    post_id,
    COUNT(*) AS vote_count,
    AVG(value) AS vote_average,
    STDDEV(value) AS vote_stddev,
    COUNT(*) FILTER (WHERE created_at > (NOW() - INTERVAL '24 hours')) AS trending_score
  FROM votes
  GROUP BY post_id
) v ON p.id = v.post_id;

-- Recreate the function using the new view structure
CREATE OR REPLACE FUNCTION get_nearby_posts_v2(
  user_lat float,
  user_long float,
  dist_km float,
  sort_by text,
  min_lat float, 
  max_lat float,
  min_long float,
  max_long float
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  created_by uuid,
  side_a text,
  side_b text,
  category text,
  lat float,
  long float,
  location_name text,
  description text,
  vote_count bigint,
  vote_average float,
  vote_stddev float,
  trending_score bigint,
  dist_meters float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.created_at,
    p.created_by,
    p.side_a,
    p.side_b,
    p.category,
    p.lat,
    p.long,
    p.location_name,
    p.description,
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
    ) AS dist_meters
  FROM post_stats_view p
  WHERE
    p.lat IS NOT NULL
    AND p.long IS NOT NULL
    AND (
      6371000 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) *
        cos(radians(p.long) - radians(user_long)) +
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= (dist_km * 1000)
  ORDER BY
    CASE WHEN sort_by = 'latest' THEN p.created_at END DESC,
    CASE WHEN sort_by = 'trending' THEN p.trending_score END DESC,
    CASE WHEN sort_by = 'divided' THEN p.vote_stddev END DESC,
    CASE WHEN sort_by = 'consensus' THEN p.vote_stddev END ASC,
    p.created_at DESC;
END;
$$;
