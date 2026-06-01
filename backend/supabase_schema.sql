-- Supabase Schema for AP-track

-- Users
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  "displayName" text,
  theme text default 'dark',
  seeded boolean default false,
  streak integer default 0,
  "lastLogin" timestamp with time zone,
  "createdAt" timestamp with time zone default now()
);
alter table public.users enable row level security;
create policy "Users can view and update their own profile" on public.users for all using (auth.uid() = id);

-- Tasks
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  title text not null,
  status text not null,
  tag text,
  "order" integer,
  "dueDate" date,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);
alter table public.tasks enable row level security;
create policy "Users can manage their own tasks" on public.tasks for all using (auth.uid() = user_id);

-- Goals
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  title text not null,
  progress integer default 0,
  target integer not null,
  unit text,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);
alter table public.goals enable row level security;
create policy "Users can manage their own goals" on public.goals for all using (auth.uid() = user_id);

-- Skills
create table public.skills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  name text not null,
  level integer default 0,
  category text,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);
alter table public.skills enable row level security;
create policy "Users can manage their own skills" on public.skills for all using (auth.uid() = user_id);

-- Notes
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  title text,
  content text,
  pinned boolean default false,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);
alter table public.notes enable row level security;
create policy "Users can manage their own notes" on public.notes for all using (auth.uid() = user_id);

-- Expenses
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  title text not null,
  amount numeric not null,
  category text,
  date date,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);
alter table public.expenses enable row level security;
create policy "Users can manage their own expenses" on public.expenses for all using (auth.uid() = user_id);

-- Metrics
create table public.metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  type text not null,
  "refId" text,
  label text,
  value numeric,
  "previousValue" numeric,
  delta numeric,
  "recordedAt" timestamp with time zone default now()
);
alter table public.metrics enable row level security;
create policy "Users can manage their own metrics" on public.metrics for all using (auth.uid() = user_id);

-- Activities
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users not null,
  type text not null,
  message text,
  metadata jsonb default '{}'::jsonb,
  "createdAt" timestamp with time zone default now()
);
alter table public.activities enable row level security;
create policy "Users can manage their own activities" on public.activities for all using (auth.uid() = user_id);

-- Enable Realtime for all tables
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.goals;
alter publication supabase_realtime add table public.skills;
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.metrics;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.users;
