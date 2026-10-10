BASANTA DRY CLEANLINESS - FIXED PACKAGE

What was fixed:
1. Homepage now reads from public.homepage_content (same table used by Content Admin).
2. Contact now reads from public.contact_information (same table used by Content Admin).
3. Services now order by sort_order and support image_url.
4. Footer links now load from public.footer_links on the homepage.
5. Content Admin footer IDs were matched to content-admin.html.
6. Content Admin Service editor close button is wired.
7. Hero image upload uses Storage bucket: website-image.
8. Supabase Storage policies are included in supabase-fix.sql.
9. services.sort_order is added safely if it was missing.
10. Supabase config now fails clearly instead of creating a client with empty credentials.
11. admin.js, track.js and success.js use the same credential placeholder format.

IMPORTANT:
- Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY in app.js,
  content-admin.js, admin.js, track.js and success.js with your real
  Supabase project URL and anon/publishable key.
- Run supabase-fix.sql once in Supabase SQL Editor.
- The included anonymous write policies are suitable only for this current
  no-login admin setup. Before real production use, add Supabase Auth and
  restrict admin INSERT/UPDATE/DELETE policies to authenticated admins.
- After deploying to GitHub Pages, hard-refresh the browser (Ctrl+F5 on PC)
  or clear the site cache on mobile.
