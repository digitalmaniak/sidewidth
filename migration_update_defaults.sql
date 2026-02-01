-- Update ALL existing users to have the full list including Gaming
update profiles 
set interests = ARRAY['Politics', 'Sports', 'Entertainment', 'Gaming', 'Technology', 'Food', 'Philosophy', 'Other'];

-- Set default for new users
alter table profiles 
alter column interests set default ARRAY['Politics', 'Sports', 'Entertainment', 'Gaming', 'Technology', 'Food', 'Philosophy', 'Other'];
