-- Enable Row Level Security
alter table athletes enable row level security;
alter table events enable row level security;
alter table meets enable row level security;
alter table meet_entries enable row level security;
alter table profiles enable row level security;

-- Allow public read access (for unauthenticated athlete search)
create policy "Public read athletes" on athletes for select using (true);
create policy "Public read events" on events for select using (true);
create policy "Public read meets" on meets for select using (true);
create policy "Public read meet_entries" on meet_entries for select using (true);

-- Profiles: users can read all, update own
create policy "Anyone can read profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Coach-only write policies for athletes
create policy "Coaches can insert athletes" on athletes for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

create policy "Coaches can update athletes" on athletes for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

create policy "Coaches can delete athletes" on athletes for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

-- Coach-only write policies for meets
create policy "Coaches can insert meets" on meets for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

create policy "Coaches can update meets" on meets for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

create policy "Coaches can delete meets" on meets for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

-- Coach-only write policies for meet_entries
create policy "Coaches can insert meet_entries" on meet_entries for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

create policy "Coaches can update meet_entries" on meet_entries for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

create policy "Coaches can delete meet_entries" on meet_entries for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

-- Coach-only write for events
create policy "Coaches can insert events" on events for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );

create policy "Coaches can update events" on events for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );
