-- ═══════════════════════════════════════════════════════
-- NightMatch: Avatar Storage + Biometric Verified
-- Correr en Supabase SQL Editor como postgres
-- ═══════════════════════════════════════════════════════

-- 1. Columna biometric_verified en profiles
alter table public.profiles
  add column if not exists biometric_verified boolean default false;

-- 2. Columna avatar_url si no existe (por si acaso)
alter table public.profiles
  add column if not exists avatar_url text;

-- 3. Bucket de Storage para avatares (público)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

-- 4. RLS en storage.objects
-- Leer: público (para que las imágenes se vean)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Subir: solo el propio usuario puede subir en su carpeta (userId/*)
drop policy if exists "avatars_user_insert" on storage.objects;
create policy "avatars_user_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Actualizar: solo el propio usuario
drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Borrar: solo el propio usuario
drop policy if exists "avatars_user_delete" on storage.objects;
create policy "avatars_user_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. RLS en profiles: usuario puede actualizar su propio biometric_verified
-- (la política de update general debería cubrirlo, pero por las dudas)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
