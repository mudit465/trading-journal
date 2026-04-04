-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Concepts / Labels table
create table if not exists concepts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);
alter table concepts enable row level security;
create policy "Users can manage own concepts" on concepts
  for all using (auth.uid() = user_id);

-- Trades table
create table if not exists trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  instrument text not null,
  direction text not null check (direction in ('LONG', 'SHORT')),
  session text check (session in ('LONDON', 'NEW_YORK', 'ASIAN', 'SYDNEY', 'OVERLAP', 'OTHER')),
  entry_time time,
  exit_time time,
  risk_amount numeric(12, 2) not null default 0,
  rr_ratio numeric(8, 2) not null default 0,
  sl_pips numeric(10, 2) not null default 0,
  tp_pips numeric(10, 2) not null default 0,
  profit_loss numeric(12, 2) not null default 0,
  status text not null check (status in ('WIN', 'LOSS', 'BREAKEVEN')),
  notes text,
  concepts text[] default '{}',
  checklist jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table trades enable row level security;
create policy "Users can manage own trades" on trades
  for all using (auth.uid() = user_id);

-- Trade TP levels
create table if not exists trade_tp_levels (
  id uuid primary key default uuid_generate_v4(),
  trade_id uuid not null references trades(id) on delete cascade,
  level integer not null,
  pips numeric(10, 2) not null,
  price numeric(15, 5),
  hit boolean not null default false
);
alter table trade_tp_levels enable row level security;
create policy "Users can manage own tp levels" on trade_tp_levels
  for all using (
    auth.uid() = (select user_id from trades where id = trade_id)
  );

-- Trade attachments
create table if not exists trade_attachments (
  id uuid primary key default uuid_generate_v4(),
  trade_id uuid not null references trades(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  created_at timestamptz not null default now()
);
alter table trade_attachments enable row level security;
create policy "Users can manage own attachments" on trade_attachments
  for all using (
    auth.uid() = (select user_id from trades where id = trade_id)
  );

-- Sticky notes
create table if not exists sticky_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  color text not null default '#fef08a',
  position_x integer not null default 0,
  position_y integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table sticky_notes enable row level security;
create policy "Users can manage own notes" on sticky_notes
  for all using (auth.uid() = user_id);

-- Storage bucket for trade attachments
insert into storage.buckets (id, name, public) values ('trade-attachments', 'trade-attachments', false)
  on conflict do nothing;

create policy "Users can upload own attachments" on storage.objects
  for insert with check (bucket_id = 'trade-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own attachments" on storage.objects
  for select using (bucket_id = 'trade-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own attachments" on storage.objects
  for delete using (bucket_id = 'trade-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

-- Updated at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trades_updated_at before update on trades
  for each row execute function update_updated_at_column();

create trigger sticky_notes_updated_at before update on sticky_notes
  for each row execute function update_updated_at_column();
