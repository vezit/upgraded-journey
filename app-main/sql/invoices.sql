create table public.invoices (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users not null,
  number      varchar not null,
  data        jsonb not null,
  pdf_url     text,
  created_at  timestamptz default now()
);
