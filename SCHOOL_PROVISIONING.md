# Provisioning Shule For Another School

Shule currently uses an isolated deployment model: each school receives its own Vercel project, Supabase project, domain, users, and data. This is the recommended commercial setup until a fully shared multi-tenant database is introduced.

## 1. Create The School Installation

1. Create a new Supabase project for the school.
2. Run `supabase/schema.sql` in its SQL Editor.
3. Create a new Vercel project from the Shule GitHub repository.
4. Add the school Supabase credentials to Vercel:

   ```text
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<server-side-secret>
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
   SHULE_SETUP_KEY=<one-time-setup-secret>
   ```

5. Deploy the Vercel project.
6. Create the first Super Admin, then remove or rotate `SHULE_SETUP_KEY`.

## 2. Brand The School

Sign in as Super Admin or School Admin and open **Setup > School Profile**. Configure:

- School name, short name, motto, contacts, and address
- Logo and report watermark
- Tenant code and report verification prefix
- Primary, secondary, and accent colours
- Portal URL

The branding is applied to the staff portal, mobile header, public report verification page, and report cards.

## 3. Distribute The Product

Use either:

- The Vercel URL supplied for that school
- A school-owned custom domain such as `results.schoolname.ac.ug`

Staff sign in through the portal. Parents and visitors use the same address only to verify a report code; they cannot open administration screens without a staff account.

## 4. Production Checklist

- Use a dedicated Supabase project per school
- Apply `supabase/production-hardening.sql`
- Keep service-role keys only in Vercel environment variables
- Create named staff accounts and role assignments
- Configure teacher class/subject assignments
- Test student import, marks entry, reports, and promotion on a preview deployment
- Enable Supabase backups and document a restore procedure
- Add a custom domain and school support contact
