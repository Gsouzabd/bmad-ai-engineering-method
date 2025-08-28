create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp default now()
);

create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  name text,
  system_prompt text,
  created_at timestamp default now()
);
