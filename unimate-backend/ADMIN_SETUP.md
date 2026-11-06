# Admin setup

1. Import `migrations/001_admin_content.sql`, `migrations/002_outlook_news.sql`, and `migrations/003_private_outlook_emails.sql` into the `unimate_db` database in numeric order using phpMyAdmin or MySQL Workbench. Run each numbered migration once.
2. From this backend folder, run `node scripts/setup-admin.js`. Enter the admin GJU email and password when prompted. The password is hidden while typing and stored only as a salted PBKDF2 hash in `.env`.
3. Restart the backend with `node server.js`.
4. Sign in through UniMate with that configured admin account. Admin sessions expire after eight hours; the session token stays in memory in the app and is not saved to browser storage.

The admin API checks authorization on the server for every edit and delete. Never commit `.env` or send the admin password in a message.

Admins can create, edit, and delete Lost & Found listings, faculty records, buildings, and news stories. The news management panel lists all saved stories independently of the public search and category filters.

## Outlook news submissions

Outlook requires a Microsoft Entra application registration before students can connect their own mailboxes:

1. In the Microsoft Entra admin center, register an app for the university tenant and add a **Web** redirect URI that exactly matches `OUTLOOK_REDIRECT_URI` (for local development: `http://localhost:5000/api/outlook/callback`).
2. Add Microsoft Graph **delegated** permissions `User.Read` and `Mail.Read`, and create a client secret. Use the tenant ID, application (client) ID, and client-secret **value** in the backend `.env`; never put the client secret in frontend code.
3. Configure `APP_SESSION_SECRET` (at least 32 random characters) and `OUTLOOK_TOKEN_ENCRYPTION_KEY` (exactly 64 hexadecimal characters). The admin setup script generates these if they are missing; keep the token-encryption key stable because existing mailbox tokens depend on it.
4. Set `OUTLOOK_TENANT_ID`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_REDIRECT_URI`, and `OUTLOOK_APP_URL`. For local Vite development, `OUTLOOK_APP_URL` is `http://localhost:5173/`.
5. Restart the backend and have each student sign in to the app with their GJU account, then connect the matching GJU Outlook account from the News page.

UniMate checks each connected user's Inbox and Sent Items every two minutes while the backend is running. Microsoft Graph delta sync imports the mailbox history in pages, then checks for new or changed mail. Imported message bodies are private to the student who connected that mailbox. A student can submit individual emails for admin review; only submitted messages appear in the admin queue, and an admin must approve them before they appear publicly. Attachments are not imported. Disconnecting deletes UniMate's stored refresh token, but already imported private drafts remain until the student deletes them; users can also revoke the app's Mail.Read permission in their Microsoft account settings.

The local redirect and app URLs above are for local development only. A deployed app must use HTTPS URLs registered in Entra and reachable by every student's device.
