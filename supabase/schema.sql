-- Run once in the SQL Editor of a new Supabase project.
create table public.study_groups (
  id text primary key,
  title text not null
);

create table public.group_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id text not null references public.study_groups(id),
  primary key (user_id, group_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.study_groups(id),
  subject text not null,
  teacher text not null,
  topic text not null,
  kind text not null default 'Лекция',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meeting_url text,
  recording_url text,
  color text not null default 'blue' check (color in ('blue', 'pink', 'violet', 'green', 'peach')),
  constraint valid_time check (ends_at > starts_at),
  constraint meeting_url_http check (meeting_url is null or meeting_url ~ '^https?://'),
  constraint recording_url_http check (recording_url is null or recording_url ~ '^https?://')
);

create index lessons_group_time on public.lessons(group_id, starts_at);
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.lessons enable row level security;

revoke all on public.study_groups, public.group_members, public.lessons from anon, authenticated;
grant select on public.study_groups, public.group_members, public.lessons to authenticated;

create policy "Read own memberships" on public.group_members
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Read own group" on public.study_groups
  for select to authenticated using (
    exists (select 1 from public.group_members m where m.group_id = study_groups.id and m.user_id = (select auth.uid()))
  );

create policy "Read lessons of own group" on public.lessons
  for select to authenticated using (
    exists (select 1 from public.group_members m where m.group_id = lessons.group_id and m.user_id = (select auth.uid()))
  );

insert into public.study_groups (id, title) values ('МИСТ-25-3-1', 'МИСТ-25-3-1');

-- Open registration for the one-group MVP. Do not derive membership from
-- editable user metadata. Add invitation checks before opening more groups.
create function public.enroll_new_student() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.group_members (user_id, group_id)
  values (new.id, 'МИСТ-25-3-1');
  return new;
end;
$$;

revoke execute on function public.enroll_new_student() from public, anon, authenticated;
create trigger enroll_student after insert on auth.users
  for each row execute function public.enroll_new_student();

-- Also enroll any accounts created before this schema was installed.
insert into public.group_members(user_id, group_id)
select id, 'МИСТ-25-3-1' from auth.users on conflict do nothing;
