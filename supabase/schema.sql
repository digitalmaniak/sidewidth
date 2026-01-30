-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public profiles, linked to Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  created_at timestamptz default now(),
  karma int default 0
);
-- RLS: Profiles are viewable by everyone, but only editable by the user.
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- POSTS (The Arguments)
create table posts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  created_by uuid references profiles(id),
  side_a text not null,
  side_b text not null,
  category text not null, -- could be an enum later
  lat float,
  long float,
  location_name text
);
alter table posts enable row level security;
create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Authenticated users can create posts." on posts for insert with check (auth.role() = 'authenticated');

-- VOTES (The Sliding Scale Consensus)
create table votes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  post_id uuid references posts(id) not null,
  user_id uuid references profiles(id) not null,
  value int not null check (value >= -100 and value <= 100),
  constraint unique_vote_per_user_pair unique(post_id, user_id)
);
alter table votes enable row level security;
create policy "Votes are viewable by everyone." on votes for select using (true);
create policy "Authenticated users can vote." on votes for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own vote." on votes for update using (auth.uid() = user_id);

-- STORAGE BUCKETS (If needed later, good to have placeholders)
-- insert into storage.buckets (id, name) values ('avatars', 'avatars');
