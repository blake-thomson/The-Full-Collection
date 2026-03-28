create table public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null default 'feature' check (type in ('feature', 'bug', 'improvement')),
  submitted_by text not null,
  submitted_by_name text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'planned', 'done', 'declined')),
  created_at timestamptz default now()
);

alter table public.feature_requests enable row level security;

create policy "team members can submit feature requests"
  on public.feature_requests for insert to authenticated with check (true);

create policy "team members can view all feature requests"
  on public.feature_requests for select to authenticated using (true);

create policy "service role can update feature requests"
  on public.feature_requests for update using (true);
