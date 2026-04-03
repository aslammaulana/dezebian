# Implementation Plan: Dashboard / Bank Content

## Deskripsi

Membuat halaman baru `dashboard/bank-content` sebagai repositori konten edukasi/problem-solving. Pola visual dan fungsional mengikuti `dashboard/reels-content`, tetapi dengan skema field yang lebih sederhana dan tanpa sistem tabel/sprint.

**Alur utama:**
1. Halaman daftar (`/dashboard/bank-content`) → tabel list dengan tombol **View** & **Edit**
2. Klik **Insert Row** → sidebar kanan muncul dengan form create
3. Klik **Edit** → redirect ke `/dashboard/bank-content/[id]` (form edit lengkap, lalu save & redirect kembali)
4. Klik **View** → redirect ke `/dashboard/bank-content/view/[id]` (tampilan read-only)

---

## Estimasi Sprint

| Sprint | Scope | Estimasi |
|--------|-------|----------|
| **Sprint 1** | Database + Type + API | ~30 menit |
| **Sprint 2** | Halaman List + Sidebar Insert | ~45 menit |
| **Sprint 3** | Halaman Edit `[id]` | ~30 menit |
| **Sprint 4** | Halaman View `view/[id]` + Sidebar nav | ~20 menit |

**Total: 4 sprint, ~2 jam kerja**

---

## Proposed Changes

### Sprint 1 — Database + Type + API

#### [MODIFY] Supabase Migration

Buat tabel baru di Supabase:

```sql
create table bank_content (
  id uuid primary key default gen_random_uuid(),
  topik_masalah text not null,
  status text not null default 'Draft', -- Draft | Development | Need Review | Published
  hook text,
  penyebab text,
  solusi text,
  fitur_unggulan text,
  cta text,
  -- Additional Card
  ai_style text,
  vo_script text,
  caption text,
  created_at timestamptz default now()
);
```

#### [MODIFY] [types.ts](file:///c:/Users/Ideapad%20Aslam/Documents/Code/Web/web-ai/webs/dezebian/lib/types.ts)

Tambahkan type baru di bawah `ReelsContent`:

```ts
export type BankContentStatus = 'Draft' | 'Development' | 'Need Review' | 'Published'

export interface BankContent {
  id: string
  topik_masalah: string
  status: BankContentStatus
  hook?: string | null
  penyebab?: string | null
  solusi?: string | null
  fitur_unggulan?: string | null
  cta?: string | null
  // Additional Card
  ai_style?: string | null
  vo_script?: string | null
  caption?: string | null
  created_at?: string
}
```

#### [NEW] `app/api/bank-content/route.ts`

Endpoint: `GET`, `POST`, `PATCH`, `DELETE` — mengikuti pola `reels-content/route.ts`.

#### [NEW] `app/api/bank-content/[id]/route.ts`

Endpoint: `GET` (single), `PATCH`, `DELETE` — mengikuti pola `reels-content/[id]/route.ts`.

---

### Sprint 2 — Halaman List + Sidebar Insert

#### [NEW] `app/dashboard/bank-content/page.tsx`

- Menampilkan tabel dengan kolom: **Topik Masalah**, **Status**, **Action (View + Edit)**
- Tombol **+ Insert Row** di header → membuka `BankContentSidebar` (sidebar kanan)
- Status ditampilkan sebagai badge berwarna:
  - `Draft` → zinc/abu
  - `Development` → blue
  - `Need Review` → orange
  - `Published` → green
- Klik **Edit** → `router.push('/dashboard/bank-content/' + id)`
- Klik **View** → `router.push('/dashboard/bank-content/view/' + id)`

#### [NEW] `components/bank-content/BankContentSidebar.tsx`

Sidebar form untuk **Insert Row**, berisi field:
- Topik Masalah: `<input type="text" />`
- Status: `<PopoverSelect />` dengan opsi [Draft, Development, Need Review, Published]
- Hook: `<textarea />`
- Penyebab: `<textarea />`
- Solusi: `<textarea />`
- Fitur Unggulan: `<textarea />`
- CTA: `<textarea />`

Submit → `POST /api/bank-content` → update state lokal → tutup sidebar.

---

### Sprint 3 — Halaman Edit `[id]`

#### [NEW] `app/dashboard/bank-content/[id]/page.tsx`

Halaman edit lengkap dengan dua card section, mengikuti pola `reels-content/[id]/page.tsx`:

**[Utama] Card:**
- Topik Masalah: `<input type="text" />`
- Status: `<PopoverSelect />`
- Hook: `<textarea />`
- Penyebab: `<textarea />`
- Solusi: `<textarea />`
- Fitur Unggulan: `<textarea />`
- CTA: `<textarea />`

**[Additional Card]:**
- AI Style: `<textarea />`
- VO Script: `<textarea />`
- Caption: `<textarea />`

Tombol aksi: **Back**, **Save** (PATCH `/api/bank-content/[id]`), **Delete**.
Setelah save → tampilkan feedback "Saved!" → tetap di halaman.
Setelah delete → redirect ke `/dashboard/bank-content`.

---

### Sprint 4 — Halaman View + Sidebar Nav

#### [NEW] `app/dashboard/bank-content/view/[id]/page.tsx`

Tampilan read-only dari semua field, mengikuti struktur yang sama dengan `[id]/page.tsx` namun:
- Semua field diganti menjadi teks statis (bukan input)
- Tidak ada tombol Save / Delete
- Hanya ada tombol **Back** dan **Edit** (redirect ke `[id]`)

#### [MODIFY] [Sidebar.tsx](file:///c:/Users/Ideapad%20Aslam/Documents/Code/Web/web-ai/webs/dezebian/components/Sidebar.tsx)

Tambahkan menu item baru di `menuItems`:

```ts
{ href: "/dashboard/bank-content", icon: Library, label: "Bank Content", exact: false },
```

Import icon `Library` dari `lucide-react`.

---

## Verification Plan

### Manual Verification (setelah tiap sprint)

**Sprint 1:**
1. Buka Supabase Dashboard → pastikan tabel `bank_content` terbentuk dengan kolom yang benar
2. Test endpoint via browser: `GET /api/bank-content` → harus return `[]`

**Sprint 2:**
1. Buka `http://localhost:3000/dashboard/bank-content`
2. Klik **+ Insert Row** → sidebar muncul dari kanan
3. Isi Topik Masalah + Status, klik Submit → row baru muncul di tabel
4. Cek tombol **View** dan **Edit** muncul di kolom Action

**Sprint 3:**
1. Klik tombol **Edit** di tabel → redirect ke `/dashboard/bank-content/[id]`
2. Ubah beberapa field, klik **Save** → muncul "Saved!" feedback
3. Refresh halaman → data tersimpan
4. Klik **Delete** → confirm dialog → redirect kembali ke list

**Sprint 4:**
1. Klik tombol **View** di tabel → redirect ke `/dashboard/bank-content/view/[id]`
2. Pastikan semua field tampil read-only (tidak ada input aktif)
3. Pastikan menu **Bank Content** muncul di sidebar navigasi kiri
