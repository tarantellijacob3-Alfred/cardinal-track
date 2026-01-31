-- Athletes table
create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  grade int,
  level text check (level in ('JV', 'Varsity')) default 'JV',
  gender text check (gender in ('Boys', 'Girls')) default 'Boys',
  active boolean default true,
  created_at timestamptz default now()
);

-- Events table
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  category text check (category in ('Field', 'Sprint', 'Distance', 'Hurdles', 'Relay', 'Other')),
  max_entries int default 4,
  is_relay boolean default false
);

-- Meets table
create table if not exists meets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  location text,
  level text check (level in ('JV', 'Varsity', 'Both')) default 'JV',
  notes text,
  created_at timestamptz default now()
);

-- Meet entries (athlete-event assignments per meet)
create table if not exists meet_entries (
  id uuid primary key default gen_random_uuid(),
  meet_id uuid references meets(id) on delete cascade,
  athlete_id uuid references athletes(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  relay_leg int,
  relay_team text check (relay_team in ('A', 'Alt')),
  created_at timestamptz default now(),
  unique(meet_id, athlete_id, event_id)
);

-- Profiles for auth
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('coach', 'parent', 'athlete')) default 'athlete',
  approved boolean default false,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_athletes_last_name on athletes(last_name);
create index if not exists idx_athletes_active on athletes(active);
create index if not exists idx_meet_entries_meet on meet_entries(meet_id);
create index if not exists idx_meet_entries_athlete on meet_entries(athlete_id);
create index if not exists idx_meet_entries_event on meet_entries(event_id);
create index if not exists idx_meets_date on meets(date);

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, approved)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'athlete', false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
