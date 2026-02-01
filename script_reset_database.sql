/*
  Script: reset_database.sql
  Description: Wipes all posts and votes, and resets user profiles to default.
  Use Case: "Partial Clean Slate"
  
  What this does:
  1. Deletes ALL Votes.
  2. Deletes ALL Posts.
  3. Resets ALL User Profiles to default values (0 Karma, Default Radius, Default Interests).
  
  What this DOES NOT do:
  1. It does NOT delete the users from authentication.
  2. It does NOT require users to sign up again. They can just log in.
*/

-- 1. Remove content (CASCADE ensures votes are deleted if attached to posts)
TRUNCATE TABLE votes, posts CASCADE;

-- 2. Reset Profile Stats (Keep the user, reset the data)
UPDATE profiles
SET 
  karma = 0,
  local_radius = 25,
  interests = ARRAY['Politics', 'Sports', 'Entertainment', 'Gaming', 'Technology', 'Food', 'Philosophy', 'Other'];

-- Note: This ensures that when users log in, they have a "fresh" profile.
