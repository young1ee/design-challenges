-- Drop email column (redundant: auth linkage is via auth_user_id, email lives in auth.users)
alter table designers drop column if exists email;

-- Auto-clear auth_user_id when the auth user is deleted from Supabase Auth
alter table designers
  add constraint designers_auth_user_id_fkey
  foreign key (auth_user_id)
  references auth.users(id)
  on delete set null;
