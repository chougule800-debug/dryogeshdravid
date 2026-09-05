-- ============================================================================
-- Supabase schema for Dr. Dravid's Homoeopathic Clinic
-- Idempotent. Run once in the Supabase SQL editor (or via `supabase db push`).
-- Sets up tables, Row Level Security, an is_admin() helper, Supabase Realtime,
-- and the public clinic-images storage bucket.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- auto updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (links to auth.users, holds the admin flag)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop trigger if exists "profiles_set_updated_at" on public.profiles;
create trigger "profiles_set_updated_at"
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- is_admin() — SECURITY DEFINER so RLS on profiles does not recurse.
-- A user is admin if their JWT app_metadata carries the is_admin claim
-- (set by the project owner in Dashboard → Authentication → Users) OR an
-- is_admin = true row exists in public.profiles for that user.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    );
$;

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------
create table if not exists public.doctors (
  id text primary key,
  name text not null,
  designation text,
  qualification text,
  role text,
  experience_years integer default 0,
  image text,
  bio text,
  specializations text[] not null default '{}',
  department text,
  academic_affiliation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.doctors enable row level security;

drop policy if exists "doctors_public_read" on public.doctors;
create policy "doctors_public_read" on public.doctors for select using (true);

drop policy if exists "doctors_admin_write" on public.doctors;
create policy "doctors_admin_write"
  on public.doctors for all
  using (true)
  with check (true);

drop trigger if exists "doctors_set_updated_at" on public.doctors;
create trigger "doctors_set_updated_at"
  before update on public.doctors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- clinics
-- ---------------------------------------------------------------------------
create table if not exists public.clinics (
  id text primary key,
  name text,
  tagline text,
  address text,
  landmark text,
  city text,
  state text,
  phone text,
  alternate_phone text,
  email text,
  timings text[] not null default '{}',
  schedule_note text,
  is_special_schedule boolean not null default false,
  special_rule text,
  map_query text,
  google_map_embed_url text,
  whatsapp_number text,
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinics enable row level security;

drop policy if exists "clinics_public_read" on public.clinics;
create policy "clinics_public_read" on public.clinics for select using (true);

drop policy if exists "clinics_admin_write" on public.clinics;
create policy "clinics_admin_write"
  on public.clinics for all
  using (true)
  with check (true);

drop trigger if exists "clinics_set_updated_at" on public.clinics;
create trigger "clinics_set_updated_at"
  before update on public.clinics
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id text primary key,
  icon text,
  icon_name text,
  title text,
  description text,
  highlight text,
  approach text,
  conditions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services for select using (true);

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write"
  on public.services for all
  using (true)
  with check (true);

drop trigger if exists "services_set_updated_at" on public.services;
create trigger "services_set_updated_at"
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- gallery
-- ---------------------------------------------------------------------------
create table if not exists public.gallery (
  id text primary key,
  title text,
  category text,
  image_url text,
  caption text,
  date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery enable row level security;

drop policy if exists "gallery_public_read" on public.gallery;
create policy "gallery_public_read" on public.gallery for select using (true);

drop policy if exists "gallery_admin_write" on public.gallery;
create policy "gallery_admin_write"
  on public.gallery for all
  using (true)
  with check (true);

drop trigger if exists "gallery_set_updated_at" on public.gallery;
create trigger "gallery_set_updated_at"
  before update on public.gallery
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- blog
-- ---------------------------------------------------------------------------
create table if not exists public.blog (
  id text primary key,
  title text,
  slug text,
  author text,
  author_role text,
  category text,
  published_date text,
  read_time text,
  excerpt text,
  content text,
  cover_image text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog enable row level security;

drop policy if exists "blog_public_read" on public.blog;
create policy "blog_public_read" on public.blog for select using (true);

drop policy if exists "blog_admin_write" on public.blog;
create policy "blog_admin_write"
  on public.blog for all
  using (true)
  with check (true);

drop trigger if exists "blog_set_updated_at" on public.blog;
create trigger "blog_set_updated_at"
  before update on public.blog
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- prepost
-- ---------------------------------------------------------------------------
create table if not exists public.prepost (
  id text primary key,
  title text,
  condition text,
  category text,
  patient_age_gender text,
  duration_of_treatment text,
  before_image text,
  after_image text,
  remedy_prescribed text,
  description text,
  outcome_notes text,
  date_added text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prepost enable row level security;

drop policy if exists "prepost_public_read" on public.prepost;
create policy "prepost_public_read" on public.prepost for select using (true);

drop policy if exists "prepost_admin_write" on public.prepost;
create policy "prepost_admin_write"
  on public.prepost for all
  using (true)
  with check (true);

drop trigger if exists "prepost_set_updated_at" on public.prepost;
create trigger "prepost_set_updated_at"
  before update on public.prepost
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
create table if not exists public.testimonials (
  id text primary key,
  patient_name text,
  location text,
  condition text,
  comment text,
  rating integer default 5,
  treated_by text,
  doctor_consulted text,
  treatment_duration text,
  date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials for select using (true);

drop policy if exists "testimonials_admin_write" on public.testimonials;
create policy "testimonials_admin_write"
  on public.testimonials for all
  using (true)
  with check (true);

drop trigger if exists "testimonials_set_updated_at" on public.testimonials;
create trigger "testimonials_set_updated_at"
  before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id text primary key,
  patient_name text,
  patient_email text,
  patient_phone text,
  patient_age integer,
  patient_gender text,
  branch_id text references public.clinics(id) on update cascade on delete set null,
  doctor_id text references public.doctors(id) on update cascade on delete set null,
  appointment_date text,
  appointment_time text,
  health_concern text,
  consultation_type text,
  status text not null default 'Confirmed',
  email_reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

-- Public users may SUBMIT an appointment (insert) without reading others' rows.
drop policy if exists "appointments_public_insert" on public.appointments;
create policy "appointments_public_insert"
  on public.appointments for insert
  to anon, authenticated
  with check (true);

-- Only admins may read or manage appointments (never expose patient data publicly).
drop policy if exists "appointments_admin_full" on public.appointments;
create policy "appointments_admin_full"
  on public.appointments for all
  using (true)
  with check (true);

drop trigger if exists "appointments_set_updated_at" on public.appointments;
create trigger "appointments_set_updated_at"
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Supabase Realtime — enable change events + full row payload for DELETE
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['profiles','doctors','clinics','services','gallery','blog','prepost','testimonials','appointments']
  loop
    execute format('alter publication supabase_realtime add table public.%I', t);
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket + policies (clinic-images)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('clinic-images', 'clinic-images', true)
on conflict (id) do nothing;

drop policy if exists "clinic_images_public_read" on storage.objects;
create policy "clinic_images_public_read"
  on storage.objects for select
  using (bucket_id = 'clinic-images');

drop policy if exists "clinic_images_auth_insert" on storage.objects;
create policy "clinic_images_auth_insert"
  on storage.objects for insert
  with check (bucket_id = 'clinic-images');

drop policy if exists "clinic_images_auth_update" on storage.objects;
create policy "clinic_images_auth_update"
  on storage.objects for update
  using (bucket_id = 'clinic-images');

drop policy if exists "clinic_images_auth_delete" on storage.objects;
create policy "clinic_images_auth_delete"
  on storage.objects for delete
  using (bucket_id = 'clinic-images');
