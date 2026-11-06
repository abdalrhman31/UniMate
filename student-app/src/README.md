# UniMate authentication

## Supabase email verification

Account registration and sign-in use Supabase Auth. Signup requires a six-digit email code before the app opens the student dashboard.

1. From the app root, install the Supabase client with `npm install @supabase/supabase-js`.
2. Create a Supabase project and copy its project URL and publishable (or anon) key into `.env.local`, using `.env.example` as a template. Put `.env.local` beside the app's `package.json`.
3. In Supabase **Authentication → Providers → Email**, enable email confirmations.
4. Set the **Confirm signup** email template to include `{{ .Token }}` so Supabase sends a code that the app can verify.
5. Start the app with `npm run dev`.

The app checks for `@gju.edu.jo` addresses in the browser, but that check is not a security boundary. Configure a Supabase **Before User Created** hook to enforce the GJU domain server-side. Never expose a Supabase service-role key through a `VITE_` variable or in browser code.

Without Supabase environment variables, account creation and sign-in show a configuration error instead of pretending to send or verify a code.
