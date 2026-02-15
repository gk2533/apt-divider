-- Run this in your Supabase SQL editor to set up the database

-- Auctions table
create table auctions (
  id uuid default gen_random_uuid() primary key,
  rent_total decimal(10,2) not null default 8150.00,
  status text not null default 'bidding' check (status in ('bidding', 'completed')),
  created_at timestamp with time zone default now()
);

-- Rooms table
create table rooms (
  id uuid default gen_random_uuid() primary key,
  auction_id uuid references auctions(id) on delete cascade not null,
  key text not null,
  name text not null,
  description text,
  sort_order int not null default 0
);

-- Participants table
create table participants (
  id uuid default gen_random_uuid() primary key,
  auction_id uuid references auctions(id) on delete cascade not null,
  name text not null,
  email text not null,
  access_token text not null unique default gen_random_uuid()::text,
  has_submitted boolean not null default false
);

-- Bids table
create table bids (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid references participants(id) on delete cascade not null,
  room_id uuid references rooms(id) on delete cascade not null,
  value decimal(10,2) not null,
  unique(participant_id, room_id)
);

-- Results table
create table results (
  id uuid default gen_random_uuid() primary key,
  auction_id uuid references auctions(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  assigned_room_id uuid references rooms(id) on delete cascade not null,
  price decimal(10,2) not null,
  utility decimal(10,2) not null
);

-- Enable realtime on key tables
alter publication supabase_realtime add table auctions;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table results;

-- Row Level Security: allow all operations via anon key for simplicity
-- (this is a private app shared among roommates, not a public service)
alter table auctions enable row level security;
alter table rooms enable row level security;
alter table participants enable row level security;
alter table bids enable row level security;
alter table results enable row level security;

create policy "Allow all on auctions" on auctions for all using (true) with check (true);
create policy "Allow all on rooms" on rooms for all using (true) with check (true);
create policy "Allow all on participants" on participants for all using (true) with check (true);
create policy "Allow all on bids" on bids for all using (true) with check (true);
create policy "Allow all on results" on results for all using (true) with check (true);
