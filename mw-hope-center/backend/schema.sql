-- MW Hope Center — form backend schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query)

-- ============ GET HELP ============
create table if not exists get_help_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone text not null,
  contact_method text not null,
  county text not null,
  best_time text,
  assistance_type text not null,
  housing_status text,
  description text not null
);
alter table get_help_submissions enable row level security;
create policy "Public can submit get help requests"
  on get_help_submissions for insert
  to anon
  with check (true);

-- ============ VOLUNTEER ============
create table if not exists volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  address text not null,
  email text not null,
  phone text not null,
  age_confirmation text not null,
  heard_about text,
  interest text not null,          -- comma-separated selected options
  availability text,
  group_type text,
  skills text,
  experience_children boolean default false,
  background_check_ack boolean not null,
  code_of_conduct_ack boolean not null
);
alter table volunteer_applications enable row level security;
create policy "Public can submit volunteer applications"
  on volunteer_applications for insert
  to anon
  with check (true);

-- ============ CONTACT ============
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null
);
alter table contact_messages enable row level security;
create policy "Public can submit contact messages"
  on contact_messages for insert
  to anon
  with check (true);

-- ============ NEWSLETTER ============
create table if not exists newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null unique
);
alter table newsletter_signups enable row level security;
create policy "Public can sign up for newsletter"
  on newsletter_signups for insert
  to anon
  with check (true);

-- NOTE: These policies allow INSERT only for the public (anon) role.
-- No SELECT/UPDATE/DELETE policy is granted to anon, so submitted data
-- cannot be read back by visitors — only by you, via the Supabase
-- dashboard or an authenticated/service-role connection.
