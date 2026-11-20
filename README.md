# BSP Agusan Council – Jamboree Management System

A full-stack Scouting Jamboree management platform for the **Boy Scouts of the Philippines – Agusan Council**, featuring participant registration, duplicate detection, Excel import validation, partial payments, global atomic Cash Receipt Vouchers (`CRV-0001+`), donations, token inventory, cash advance workflows, line-item liquidations, and audit logging.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Create a new project in [Supabase](https://supabase.com).
   - Open the **SQL Editor** and execute `supabase/migrations/001_initial_schema.sql` followed by `supabase/migrations/002_rls_and_storage.sql`.
   - Copy `.env.example` to `.env` and fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```
# Jamboree
# Jamboree
# Jamboree
