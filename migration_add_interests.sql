alter table profiles
add column if not exists interests text[] default null;
