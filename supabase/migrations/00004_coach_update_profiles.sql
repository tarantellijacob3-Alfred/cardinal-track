-- Allow approved coaches to update profiles (promote/demote/approve)
create policy "Coaches can update profiles" on profiles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'coach'
      and profiles.approved = true
    )
  );
