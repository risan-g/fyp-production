-- Recreate the public avatars bucket used by DOTWV.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  null,
  null
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- Public avatar images can be read without authentication.
create policy "Avatar images are publicly accessible."
on storage.objects
for select
to public
using (bucket_id = 'avatars');


-- Authenticated users can upload files to the avatars bucket.
create policy "Anyone can upload an avatar."
on storage.objects
for insert
to public
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
);


-- Users can update avatar objects that they own.
create policy "Users can update their own avatar."
on storage.objects
for update
to public
using (auth.uid() = owner)
with check (bucket_id = 'avatars');
