create type public.app_role as enum ('farmer', 'buyer', 'admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can view own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'New User',
  phone text not null default '',
  county text not null default '',
  verified boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.buyers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  producer_type text not null,
  buys text[] not null default '{}',
  location text not null default '',
  county text not null default '',
  price_min integer not null default 0,
  price_max integer not null default 0,
  verified boolean not null default false,
  rating numeric(2,1) not null default 4.5,
  reviews integer not null default 0,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select on public.buyers to authenticated;
grant all on public.buyers to service_role;
alter table public.buyers enable row level security;
create policy "Authenticated users can view buyers" on public.buyers for select to authenticated using (true);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  waste_type text not null,
  quantity_tons numeric not null default 0,
  price_per_ton integer not null default 0,
  location text not null default '',
  county text not null default '',
  status text not null default 'available' check (status in ('available','pending','sold')),
  image_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.listings to authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;
create policy "Authenticated users can view listings" on public.listings for select to authenticated using (true);
create policy "Farmers can insert own listings" on public.listings for insert to authenticated with check (farmer_id = auth.uid());
create policy "Farmers can update own listings" on public.listings for update to authenticated using (farmer_id = auth.uid()) with check (farmer_id = auth.uid());
create policy "Farmers can delete own listings" on public.listings for delete to authenticated using (farmer_id = auth.uid());

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid references public.buyers(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  waste_type text not null,
  tons numeric not null default 0,
  amount integer not null default 0,
  status text not null default 'completed' check (status in ('pending','completed','failed')),
  counterparty text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "Users can view own transactions" on public.transactions for select to authenticated using (farmer_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Farmers can insert own transactions" on public.transactions for insert to authenticated with check (farmer_id = auth.uid());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender text not null default 'Takathamani',
  subject text not null default '',
  body text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Users can view own messages" on public.messages for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own messages" on public.messages for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own messages" on public.messages for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own messages" on public.messages for delete to authenticated using (user_id = auth.uid());

create table public.impact_stats (
  id integer primary key default 1,
  total_recovered_tons numeric not null default 0,
  co2_avoided_tons numeric not null default 0,
  trees_equivalent integer not null default 0,
  farmers_benefited integer not null default 0,
  jobs_created integer not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.impact_stats to authenticated;
grant all on public.impact_stats to service_role;
alter table public.impact_stats enable row level security;
create policy "Authenticated users can view impact stats" on public.impact_stats for select to authenticated using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, county)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'phone', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'county', '')
  )
  on conflict (id) do update
    set full_name = coalesce(new.raw_user_meta_data->>'full_name', public.profiles.full_name),
        phone = coalesce(new.raw_user_meta_data->>'phone', public.profiles.phone),
        county = coalesce(new.raw_user_meta_data->>'county', public.profiles.county);
  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'farmer'))
  on conflict (user_id, role) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  uid uuid;
  b_green uuid;
  b_tanga uuid;
  b_kenya uuid;
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', '0712345678@takathamani.app', crypt('1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Kamau","county":"Nakuru County","phone":"+254 712 345678"}', now(), now())
  returning id into uid;

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid()::text, uid, jsonb_build_object('sub', uid::text, 'email', '0712345678@takathamani.app'), 'email', now(), now(), now());

  insert into public.profiles (id, full_name, phone, county, verified) values (uid, 'John Kamau', '+254 712 345678', 'Nakuru County', true)
  on conflict (id) do update set full_name = 'John Kamau', phone = '+254 712 345678', county = 'Nakuru County', verified = true;
  insert into public.user_roles (user_id, role) values (uid, 'farmer') on conflict do nothing;

  insert into public.buyers (company_name, producer_type, buys, location, county, price_min, price_max, verified, rating, reviews)
  values
    ('GreenFuel Ltd', 'Biofuel Producer', array['Maize Cobs','Rice Husk'], 'Nakuru - Rongai', 'Nakuru County', 16000, 20000, true, 4.8, 182),
    ('Tanga Feeds', 'Animal Feed Producer', array['Maize Cobs','Sunflower Stalks'], 'Nakuru - Naka', 'Nakuru County', 15000, 18000, true, 4.6, 95),
    ('Kenya Biomass Energy', 'Energy Producer', array['Maize Cobs','Rice Husk','Sunflower Residues'], 'Gilgil', 'Nakuru County', 12000, 16000, true, 4.7, 120);
  select id into b_green from public.buyers where company_name = 'GreenFuel Ltd';
  select id into b_tanga from public.buyers where company_name = 'Tanga Feeds';
  select id into b_kenya from public.buyers where company_name = 'Kenya Biomass Energy';

  insert into public.listings (farmer_id, waste_type, quantity_tons, price_per_ton, location, county, status, created_at)
  values
    (uid, 'Maize Cobs', 15, 18000, 'Nakuru - Rongai', 'Nakuru County', 'available', now() - interval '2 days'),
    (uid, 'Rice Husk', 40, 12000, 'Kisumu - Ahero', 'Kisumu County', 'available', now() - interval '1 day'),
    (uid, 'Sugarcane Bagasse', 20, 11000, 'Kakamega - Matungu', 'Kakamega County', 'available', now() - interval '4 days');

  insert into public.transactions (farmer_id, buyer_id, waste_type, tons, amount, status, counterparty, paid_at, created_at)
  values
    (uid, b_green, 'Maize Cobs', 1.5, 27000, 'completed', 'GreenFuel Ltd', '2025-04-10 14:32+00', '2025-04-10 14:32+00'),
    (uid, b_tanga, 'Rice Husk', 1.0, 12500, 'completed', 'Tanga Feeds', '2025-04-05 09:15+00', '2025-04-05 09:15+00'),
    (uid, b_green, 'Sugarcane Bagasse', 1.2, 18000, 'completed', 'GreenFuel Ltd', '2025-03-28 11:40+00', '2025-03-28 11:40+00');

  insert into public.messages (user_id, sender, subject, body, read, created_at)
  values
    (uid, 'GreenFuel Ltd', 'New offer for your Maize Cobs', 'We reviewed your maize cobs listing and would like to purchase 5 tons at KSh 18,000 per ton. Can we arrange collection this week?', false, now() - interval '3 hours'),
    (uid, 'Takathamani', 'Payment received', 'Your payment of KSh 27,000 from GreenFuel Ltd has been sent to your mobile money wallet.', true, now() - interval '2 days');

  insert into public.impact_stats (id, total_recovered_tons, co2_avoided_tons, trees_equivalent, farmers_benefited, jobs_created, breakdown)
  values (1, 4.8, 11.2, 2450, 28, 12, '{"Maize Cobs":45,"Rice Husk":30,"Bagasse":15,"Other":10}')
  on conflict (id) do update set total_recovered_tons = 4.8, co2_avoided_tons = 11.2, trees_equivalent = 2450, farmers_benefited = 28, jobs_created = 12, breakdown = '{"Maize Cobs":45,"Rice Husk":30,"Bagasse":15,"Other":10}'::jsonb;
end $$;