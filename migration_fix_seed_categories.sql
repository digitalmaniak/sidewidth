-- Map invalid/legacy categories to allowed ones
-- Transport -> OTHER (Could be TECHNOLOGY if Uber/Subway, but typically OTHER)
-- Lifestyle -> OTHER
-- Nature -> OTHER
-- Tech -> TECHNOLOGY (Direct mapping)
-- Education -> OTHER
-- Food -> FOOD (Already matches but ensure case)

-- Update posts with invalid categories
UPDATE posts SET category = 'OTHER' WHERE category IN ('TRANSPORT', 'Transport', 'LIFESTYLE', 'Lifestyle', 'NATURE', 'Nature', 'EDUCATION', 'Education');
UPDATE posts SET category = 'TECHNOLOGY' WHERE category IN ('TECH', 'Tech');
UPDATE posts SET category = 'FOOD' WHERE category IN ('Food', 'FOOD'); -- Ensure FOOD is uppercase (handled by previous migration but good to be safe)

-- Ideally, we would inspect the content, but for now we map known seed values manually.
-- 'Subway vs Uber' (Transport) -> OTHER (or TECHNOLOGY?) Let's stick to OTHER as safe default.
-- 'Morning vs Night' (Lifestyle) -> OTHER
-- 'Cats vs Dogs' (Nature) -> OTHER
-- 'Winter vs Summer' (Nature) -> OTHER
-- 'React vs Vue' (Tech) -> TECHNOLOGY
