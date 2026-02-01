/*
  Script: remove_duplicates.sql
  Description: Safely removes duplicate posts that have zero votes.
  Logic:
    1. Identifies duplicates based on case-insensitive side_a, side_b, and category.
    2. Prioritizes keeping posts with votes, then the oldest post.
    3. Deletes only those that are not the "best" in their group AND have zero votes.
*/

WITH ranked_posts AS (
    SELECT
        p.id,
        ROW_NUMBER() OVER (
            -- Group by the content that makes them "duplicates"
            PARTITION BY lower(trim(p.side_a)), lower(trim(p.side_b)), lower(trim(p.category))
            -- Rank: 1 is the one we keep
            ORDER BY 
                (SELECT COUNT(*) FROM votes v WHERE v.post_id = p.id) DESC, -- Keep ones with votes
                p.created_at ASC -- Tie-breaker: Keep the original (oldest)
        ) as rank
    FROM
        posts p
)
DELETE FROM posts
WHERE id IN (
    SELECT id 
    FROM ranked_posts 
    WHERE rank > 1
)
AND id NOT IN (SELECT DISTINCT post_id FROM votes);
