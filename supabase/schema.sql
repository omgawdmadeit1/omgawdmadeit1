create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  stripe_customer_id text unique,
  subscription_tier text not null default 'free',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.usage_logs (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade not null,
  tokens_used integer not null check (tokens_used >= 0),
  model text not null,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;
alter table public.usage_logs enable row level security;

create policy "Users can read their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their own usage logs" on public.usage_logs
  for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
