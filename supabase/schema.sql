-- =============================================================
-- Supabase Schema — Dezebian Content Planning
-- Jalankan di Supabase SQL Editor
-- =============================================================

-- 1. Tabel untuk Sprint / Bulan (sama konsep dengan "tables" di task-manager)
create table if not exists content_tables (
    id            uuid primary key default gen_random_uuid(),
    title         text not null default '',
    type          text not null default 'sprint', -- 'sprint' | 'tasks'
    sprint_number int,
    created_at    timestamptz not null default now()
);

-- Tambah satu row default "Tasks" sebagai table utama
insert into content_tables (title, type, sprint_number)
values ('Tasks', 'tasks', null);

-- 2. Tabel konten utama
create table if not exists reels_content (
    id                  uuid primary key default gen_random_uuid(),

    -- [Utama]
    topic               text not null default '',
    product_name        text,
    posting_date        timestamptz,
    status              text not null default 'idea',
    format              text,
    hook                text,
    priority            text not null default 'Med',
    sprint_id           uuid references content_tables(id) on delete set null,

    -- [Kategorisasi]
    content_type        text,
    section             text,
    sub_section         text,
    target_audience     text,
    funnel              text,
    offer_status        text,
    brand               text,

    -- [Script]
    visual_link         text,
    visual_description  text,
    attention           text,
    interest            text,
    desire              text,
    action              text,
    voiceover_script    text,

    -- [Additional Info]
    caption             text,
    hashtag             text,
    audio               text,
    reference_link      text,
    location            text,

    -- Meta
    table_id            uuid not null references content_tables(id) on delete cascade,
    created_at          timestamptz not null default now()
);

-- 3. (Opsional) Row Level Security — aktifkan jika pakai auth
-- alter table content_tables enable row level security;
-- alter table reels_content enable row level security;
-- create policy "allow all" on content_tables for all using (true);
-- create policy "allow all" on reels_content for all using (true);

-- =============================================================
-- 4. Tabel untuk daftar opsi select (dynamic dropdown options)
-- =============================================================
-- category = nama field (contoh: 'format', 'content_type', 'section', dll)
-- value    = nilai yang disimpan
-- label    = teks yang ditampilkan (opsional, jika kosong = value)
-- Jalankan ALTER ini jika tabel sudah ada sebelumnya, atau buat baru
create table if not exists select_options (
    id           uuid primary key default gen_random_uuid(),
    category     text not null,  -- 'format' | 'content_type' | 'section' | 'sub_section' | 'target_audience' | 'funnel' | 'offer_status' | 'brand'
    value        text not null,
    label        text,           -- tampilan (jika null, gunakan value)
    order_index  int not null default 0,
    created_at   timestamptz not null default now(),
    unique(category, value)
);

-- (Tidak ada seed data — tambahkan opsi lewat halaman /dashboard/kategori-konten)


-- =============================================================
-- 5. Tabel untuk Content Type (/dashboard/content-type)
-- =============================================================
create table if not exists content_types (
    id             uuid primary key default gen_random_uuid(),
    topik          text not null default '',
    link_instagram text not null default '',
    jenis          uuid references content_tables(id) on delete set null,
    deskripsi      text,
    views          int not null default 0,
    table_id       uuid not null references content_tables(id) on delete cascade,
    created_at     timestamptz not null default now()
);

-- content_types menggunakan content_tables dengan type = 'content-type'
-- Buat tabel grup via halaman /dashboard/content-type → sidebar "New Table"
