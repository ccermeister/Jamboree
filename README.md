# BSP Agusan Council – Jamboree Management System

A full-stack Scouting Jamboree management platform for the **Boy Scouts of the Philippines – Agusan Council**, featuring participant registration, duplicate detection, Excel import validation, partial payments, global atomic Cash Receipt Vouchers (`CRV-0001+`), donations, token inventory, cash advance workflows, line-item liquidations, and audit logging.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Create a new project in [Supabase](https://supabase.com).
   - Open the **SQL Editor** and execute `supabase/migrations/001_initial_schema.sql`, `002_rls_and_storage.sql`, and `003_app_integration.sql`, in that order.
   - Set `VITE_SUPABASE_URL` and the project's public/anon key as `VITE_SUPABASE_ANON_KEY` in `.env`. Never put a `service_role` key in this frontend project.
   - Create staff accounts in **Authentication → Users**. For each account, add a matching `public.user_profiles` row using its Auth user ID, full name, email, and role. The app requires an active profile to sign in.

   For an initial administrator profile, replace the example values and run this in the SQL Editor after creating that Auth user:
   ```sql
   INSERT INTO public.user_profiles (id, full_name, email, role)
   SELECT id, 'Admin Name', email, 'System Administrator'::public.user_role
   FROM auth.users
   WHERE email = 'admin@example.com';
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   Sign in with an account created in Supabase Auth. The app loads its workspace and role from Supabase; the former in-app role switcher is not used for access control.

4. **Build for production:**
   ```bash
   npm run build
   ```
# Jamboree
# Jamboree
# Jamboree
