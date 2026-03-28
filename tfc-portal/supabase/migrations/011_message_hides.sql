-- Per-user message hiding (client messages)
create table if not exists public.message_hides (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  message_id uuid not null references public.messages(id) on delete cascade,
  hidden_at timestamptz default now(),
  unique(user_email, message_id)
);

-- Per-user message hiding (team messages)
create table if not exists public.team_message_hides (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  message_id uuid not null references public.team_messages(id) on delete cascade,
  hidden_at timestamptz default now(),
  unique(user_email, message_id)
);

create index if not exists idx_message_hides_user on public.message_hides(user_email);
create index if not exists idx_team_message_hides_user on public.team_message_hides(user_email);

alter table public.message_hides enable row level security;
alter table public.team_message_hides enable row level security;

create policy "service role can manage message_hides" on public.message_hides using (true) with check (true);
create policy "service role can manage team_message_hides" on public.team_message_hides using (true) with check (true);
