# Implementation Plan - Fix Owner Privileges and Store Redirection

The user is experiencing two issues:
1. Owners/Admins cannot edit, delete, or add products despite being logged in.
2. After login, they are not redirected to their specific store context ("outside the store").

## User Review Required

> [!IMPORTANT]
> The database changes require re-running the SQL setup or applying the new policies manually in the Supabase SQL Editor.

## Proposed Changes

### Database & Security

#### [MODIFY] [supabase/01-setup-database.sql](file:///c:/Users/ROCELLGADGET/maju-bersama-178/supabase/01-setup-database.sql)
- Add missing RLS policies for `INSERT`, `UPDATE`, and `DELETE` on `products`, `stores`, and `banners`.
- Update `has_store_role` to be more robust.
- Ensure `store_memberships` policies allow owners to see their own data.

### API & Session Handling

#### [MODIFY] [src/app/api/owner/_session.ts](file:///c:/Users/ROCELLGADGET/maju-bersama-178/src/app/api/owner/_session.ts)
- Improve `super_admin` detection.
- Ensure that if a user is a `super_admin` in *any* store, they can act as `super_admin` for others (or at least simplify the check).

### Frontend & Store Context

#### [MODIFY] [src/components/owner/owner-store-scope.tsx](file:///c:/Users/ROCELLGADGET/maju-bersama-178/src/components/owner/owner-store-scope.tsx)
- Automatically select the first available store for `super_admin` if no store is currently selected in `localStorage`.
- This ensures they are "inside" a store context immediately after login.

#### [MODIFY] [src/app/login/page.tsx](file:///c:/Users/ROCELLGADGET/maju-bersama-178/src/app/login/page.tsx)
- Ensure redirection to `/dashboard` is consistent and works correctly with the `mode=owner` parameter.

## Verification Plan

### Automated Tests
- N/A (Manual verification required due to Supabase dependency).

### Manual Verification
1. Log in as a store owner (e.g., `toko01`).
2. Verify redirection to `/dashboard`.
3. Verify that the store name is correctly displayed.
4. Go to "Produk Saya" and attempt to add, edit, and delete a product.
5. Log in as a Master Admin (e.g., `master@mb178.online`).
6. Verify that a store is automatically selected and they are not "outside" the context.
