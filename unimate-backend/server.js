import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { ImapFlow } from 'imapflow';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  if (typeof process.loadEnvFile !== 'function') {
    throw new Error('Node.js 20.12 or newer is required to load the backend .env file.');
  }
  process.loadEnvFile(envFile);
}

const app = express();

// إعدادات CORS الموحدة
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// طباعة كل طلب وارد في شاشة السيرفر
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] Received ${req.method} request on ${req.path}`);
  next();
});

const aiApiKey = process.env.GEMINI_API_KEY || '';
const hasValidGeminiKey = aiApiKey && !aiApiKey.includes('ضع_مفتاحك_هنا');
const ai = hasValidGeminiKey ? new GoogleGenAI({ apiKey: aiApiKey }) : null;

const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
const adminSessionSecret = process.env.ADMIN_SESSION_SECRET || '';
const appSessionSecret = process.env.APP_SESSION_SECRET || 'unimate_super_secret_session_key_32bytes_min';
const outlookClientId = process.env.OUTLOOK_CLIENT_ID || '';
const outlookClientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';
const outlookTenantId = process.env.OUTLOOK_TENANT_ID || '';
const outlookRedirectUri = process.env.OUTLOOK_REDIRECT_URI || '';
const outlookAppUrl = process.env.OUTLOOK_APP_URL || 'http://localhost:5173/';
const outlookEncryptionKey = process.env.OUTLOOK_TOKEN_ENCRYPTION_KEY || '';

const adminAuthConfigured = Boolean(
  adminEmail
  && /^[a-f0-9]{32}:[a-f0-9]{64}$/i.test(adminPasswordHash)
  && adminSessionSecret.length >= 32,
);

const outlookAuthConfigured = Boolean(
  appSessionSecret.length >= 32
  && outlookClientId
  && outlookClientSecret
  && outlookTenantId
  && outlookRedirectUri
  && /^[a-f0-9]{64}$/i.test(outlookEncryptionKey),
);

const adminLoginFailures = new Map();

const secureEqual = (first, second) => {
  const firstHash = crypto.createHash('sha256').update(first).digest();
  const secondHash = crypto.createHash('sha256').update(second).digest();
  return crypto.timingSafeEqual(firstHash, secondHash);
};

const verifyAdminPassword = (password) => {
  const [salt, expectedHash] = adminPasswordHash.split(':');
  if (!salt || !expectedHash) return false;
  const passwordHash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return secureEqual(passwordHash, expectedHash);
};

const signAdminToken = (email) => {
  const payload = Buffer.from(JSON.stringify({
    email,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', adminSessionSecret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
};

const signAppToken = (userId, email) => {
  const payload = Buffer.from(JSON.stringify({
    userId,
    email,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', appSessionSecret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
};

const requireUser = (req, res, next) => {
  if (appSessionSecret.length < 32) {
    return res.status(503).json({ error: 'Student sessions are not configured on the backend.' });
  }
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const [payload, signature] = (token || '').split('.');
  if (!payload || !signature) {
    return res.status(401).json({ error: 'Sign in to your student account first.' });
  }
  const expectedSignature = crypto
    .createHmac('sha256', appSessionSecret)
    .update(payload)
    .digest('base64url');
  if (!secureEqual(signature, expectedSignature)) {
    return res.status(401).json({ error: 'Your student session is invalid. Sign in again.' });
  }
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(session.userId) || session.userId < 1
      || typeof session.email !== 'string'
      || !Number.isFinite(session.expiresAt)
      || session.expiresAt <= Date.now()) {
      return res.status(401).json({ error: 'Your student session is invalid or expired. Sign in again.' });
    }
    req.student = { id: session.userId, email: session.email.toLowerCase() };
    return next();
  } catch (error) {
    console.error('Could not decode a student session.', error);
    return res.status(401).json({ error: 'Your student session is invalid. Sign in again.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!adminAuthConfigured) {
    return res.status(503).json({ error: 'Admin authentication is not configured on the backend.' });
  }

  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const [payload, signature] = (token || '').split('.');
  if (!payload || !signature) {
    return res.status(401).json({ error: 'Admin sign-in is required.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', adminSessionSecret)
    .update(payload)
    .digest('base64url');
  if (!secureEqual(signature, expectedSignature)) {
    return res.status(401).json({ error: 'Admin session is invalid or expired. Sign in again.' });
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (session.email !== adminEmail || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
      return res.status(401).json({ error: 'Admin session is invalid or expired. Sign in again.' });
    }
    req.adminEmail = session.email;
    return next();
  } catch (error) {
    console.error('Could not decode an admin session.', error);
    return res.status(401).json({ error: 'Admin session is invalid or expired. Sign in again.' });
  }
};

const getPositiveId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const getRequiredText = (value, label, maxLength) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`${label} is required and must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
};

const getOptionalText = (value, label, maxLength) => {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
};

const getDateValue = (value, label) => {
  const date = getRequiredText(value, label, 10);
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error(`${label} must be a valid YYYY-MM-DD date.`);
  }
  return date;
};

const validateDoctor = (body) => {
  const email = getOptionalText(body.email, 'Email', 100);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid faculty email.');
  return {
    full_name: getRequiredText(body.full_name, 'Name', 100),
    position: getRequiredText(body.position, 'Title', 100),
    department: getRequiredText(body.department, 'School or department', 100),
    email,
    office_room: getOptionalText(body.office_room, 'Office', 50) || null,
    office_hours: getOptionalText(body.office_hours, 'Office hours', 100) || null,
  };
};

const validateBuilding = (body) => ({
  name: getRequiredText(body.name, 'Building name', 150),
  code: getRequiredText(body.code, 'Building code', 80),
  college: getRequiredText(body.college, 'School', 150),
  location: getRequiredText(body.location, 'Location', 255),
  details: getRequiredText(body.details, 'Details', 1000),
  floors: getRequiredText(body.floors, 'Floors', 50),
});

const validateNews = (body) => {
  return {
    title: getRequiredText(body.title, 'Title', 200),
    category: getRequiredText(body.category, 'Category', 80),
    date: getDateValue(body.date, 'Date'),
    read_time: getRequiredText(body.read_time, 'Read time', 40),
    summary: getRequiredText(body.summary, 'Summary', 2000),
  };
};

const encryptRefreshToken = (token) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(outlookEncryptionKey, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('hex')).join(':');
};

const outlookAccessTokens = new Map();

const decryptRefreshToken = (value) => {
  const [ivHex, tagHex, encryptedHex] = value.split(':');
  if (!ivHex || !tagHex || !encryptedHex) throw new Error('Stored Outlook credentials are invalid.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(outlookEncryptionKey, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
};

const outlookTokenUrl = () => `https://login.microsoftonline.com/${encodeURIComponent(outlookTenantId)}/oauth2/v2.0/token`;
const outlookScopes = 'openid profile email offline_access User.Read Mail.Read';

const getOutlookAccessToken = async (connection) => {
  const cached = outlookAccessTokens.get(connection.user_id);
  if (cached && cached.expiresAt > Date.now() + 60 * 1000) return cached.value;
  const refreshToken = decryptRefreshToken(connection.encrypted_refresh_token);
  const response = await fetch(outlookTokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: outlookClientId,
      client_secret: outlookClientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: outlookScopes,
    }),
  });
  const tokens = await response.json();
  if (!response.ok || !tokens.access_token) {
    throw new Error(`Microsoft token refresh failed (${response.status}): ${tokens.error_description || tokens.error || 'unknown error'}`);
  }
  if (tokens.refresh_token) {
    const encryptedRefreshToken = encryptRefreshToken(tokens.refresh_token);
    await pool.query(
      'UPDATE outlook_connections SET encrypted_refresh_token = ? WHERE user_id = ?',
      [encryptedRefreshToken, connection.user_id],
    );
    connection.encrypted_refresh_token = encryptedRefreshToken;
  }
  outlookAccessTokens.set(connection.user_id, {
    value: tokens.access_token,
    expiresAt: Date.now() + (Number(tokens.expires_in) || 3600) * 1000,
  });
  return tokens.access_token;
};

const outlookGraphRequest = async (connection, graphPath) => {
  const accessToken = await getOutlookAccessToken(connection);
  const requestUrl = graphPath.startsWith('https://')
    ? new URL(graphPath)
    : new URL(`/v1.0${graphPath}`, 'https://graph.microsoft.com');
  if (requestUrl.origin !== 'https://graph.microsoft.com' || !requestUrl.pathname.startsWith('/v1.0/')) {
    throw new Error('Microsoft Graph returned an unexpected continuation URL.');
  }
  const response = await fetch(requestUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Microsoft Graph request failed (${response.status}): ${result.error?.message || 'unknown error'}`);
  }
  return result;
};

const htmlToText = (value) => value
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>|<\/(div|p|li|tr|h[1-6])>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/gi, "'")
  .replace(/&#(\d+);/g, (_, code) => {
    const point = Number(code);
    return point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point)
      : ' ';
  })
  .replace(/&#x([a-f\d]+);/gi, (_, code) => {
    const point = parseInt(code, 16);
    return point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point)
      : ' ';
  })
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const syncOutlookFolder = async (connection, folder) => {
  const deltaColumn = folder === 'inbox' ? 'inbox_delta_link' : 'sentitems_delta_link';
  const nextColumn = folder === 'inbox' ? 'inbox_next_link' : 'sentitems_next_link';
  const fields = 'id,subject,body,bodyPreview,receivedDateTime,sentDateTime,from,webLink';
  const query = new URLSearchParams({ '$select': fields, '$top': '100' });
  let nextUrl = connection[nextColumn]
    || connection[deltaColumn]
    || `/me/mailFolders/${folder}/messages/delta?${query.toString()}`;
  let imported = 0;
  let pages = 0;

  while (nextUrl && pages < 5) {
    const data = await outlookGraphRequest(connection, nextUrl);
    for (const message of data.value || []) {
      if (message['@removed']) {
        if (message.id) {
          await pool.query(
            `DELETE FROM email_news_drafts
             WHERE user_id = ? AND source_folder = ? AND outlook_message_id = ? AND status = 'private'`,
            [connection.user_id, folder, message.id],
          );
        }
        continue;
      }
      if (!message.id) continue;
      const subject = typeof message.subject === 'string' && message.subject.trim()
        ? message.subject.trim()
        : '(No subject)';
      const senderEmail = message.from?.emailAddress?.address?.trim().toLowerCase() || connection.email.toLowerCase();
      const bodyValue = message.body?.content || message.bodyPreview || '';
      const summary = htmlToText(bodyValue).slice(0, 2000);
      const messageDate = folder === 'inbox'
        ? message.receivedDateTime || message.sentDateTime
        : message.sentDateTime || message.receivedDateTime;
      const emailDate = new Date(messageDate || Date.now());
      if (Number.isNaN(emailDate.getTime())) continue;
      const [result] = await pool.query(
        `INSERT INTO email_news_drafts
         (user_id, outlook_message_id, source_folder, sender_email, title, date, summary, source_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'private')
         ON DUPLICATE KEY UPDATE
           sender_email = IF(status = 'private', VALUES(sender_email), sender_email),
           title = IF(status = 'private', VALUES(title), title),
           date = IF(status = 'private', VALUES(date), date),
           summary = IF(status = 'private', VALUES(summary), summary),
           source_url = IF(status = 'private', VALUES(source_url), source_url)`,
        [
          connection.user_id,
          message.id,
          folder,
          senderEmail,
          subject.slice(0, 200),
          emailDate.toISOString().slice(0, 10),
          summary,
          typeof message.webLink === 'string' ? message.webLink.slice(0, 1000) : null,
        ],
      );
      if (result.affectedRows === 1) imported += 1;
    }

    pages += 1;
    if (typeof data['@odata.nextLink'] === 'string') {
      nextUrl = data['@odata.nextLink'];
      connection[nextColumn] = nextUrl;
      await pool.query(
        `UPDATE outlook_connections SET ${nextColumn} = ? WHERE user_id = ?`,
        [nextUrl, connection.user_id],
      );
    } else {
      const deltaUrl = typeof data['@odata.deltaLink'] === 'string' ? data['@odata.deltaLink'] : null;
      nextUrl = null;
      connection[nextColumn] = null;
      if (deltaUrl) {
        connection[deltaColumn] = deltaUrl;
        await pool.query(
          `UPDATE outlook_connections SET ${deltaColumn} = ?, ${nextColumn} = NULL WHERE user_id = ?`,
          [deltaUrl, connection.user_id],
        );
      }
    }
  }
  return imported;
};

const syncOutlookConnection = async (connection) => {
  if (syncingOutlookUsers.has(connection.user_id)) return 0;
  syncingOutlookUsers.add(connection.user_id);
  try {
    const importedInbox = await syncOutlookFolder(connection, 'inbox');
    const importedSent = await syncOutlookFolder(connection, 'sentitems');
    return importedInbox + importedSent;
  } finally {
    syncingOutlookUsers.delete(connection.user_id);
  }
};

let isOutlookSyncRunning = false;
const syncingOutlookUsers = new Set();

// 1. REGISTER ROUTE (Create Account)
app.post('/api/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name || '', email, password]
    );

    res.status(201).json({
      message: 'Account created and saved in MySQL successfully.',
      userId: result.insertId,
      appToken: signAppToken(result.insertId, email),
    });
  } catch (err) {
    console.error('Registration query error:', err.message);
    res.status(500).json({ error: 'Failed to save account in MySQL database.' });
  }
});

// 2. LOGIN ROUTE (Sign In)
app.post('/api/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (email === adminEmail) {
    if (!adminAuthConfigured) {
      return res.status(503).json({ error: 'Admin authentication is not configured on the backend.' });
    }
    const clientIp = req.ip;
    const failure = adminLoginFailures.get(clientIp);
    if (failure?.lockedUntil > Date.now()) {
      return res.status(429).json({ error: 'Too many unsuccessful admin sign-in attempts. Try again later.' });
    }
    if (!verifyAdminPassword(password)) {
      const attempts = (failure?.attempts || 0) + 1;
      adminLoginFailures.set(clientIp, {
        attempts,
        lockedUntil: attempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    adminLoginFailures.delete(clientIp);
    return res.json({
      message: 'Admin sign-in successful',
      role: 'admin',
      adminToken: signAdminToken(email),
      user: {
        full_name: 'Administrator',
        email,
      },
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      console.log('Login failed: Invalid email or password');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    console.log('Login success for user:', rows[0].full_name);
    res.json({
      message: 'Login successful',
      user: {
        id: rows[0].id,
        full_name: rows[0].full_name,
        email: rows[0].email,
      },
      appToken: signAppToken(rows[0].id, email),
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

app.get('/api/admin/session', requireAdmin, (req, res) => {
  res.json({ role: 'admin', email: req.adminEmail });
});

// Mock database storage for Outlook fallback
const mockOutlookUsers = new Map();
const mockEmailDrafts = [
  {
    id: 101,
    source_folder: 'inbox',
    sender_email: 'reg@gju.edu.jo',
    title: 'Registration Schedule for Second Semester 2026/2027',
    date: new Date().toISOString().slice(0, 10),
    summary: 'Dear Students, Please find the timetable and dates for course registration according to completed credit hours on the university student portal.',
    source_url: 'https://gju.edu.jo/announcements',
    status: 'private',
  },
  {
    id: 102,
    source_folder: 'inbox',
    sender_email: 'cs-department@gju.edu.jo',
    title: 'CS412: Graduation Project Milestone & System Architecture Review',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    summary: 'Reminder to all senior students: Submit your updated system architecture document and database schema diagrams before Thursday evening.',
    source_url: null,
    status: 'private',
  },
  {
    id: 103,
    source_folder: 'inbox',
    sender_email: 'activities@gju.edu.jo',
    title: 'Annual Technology Day and Innovation Exhibition 2026',
    date: new Date(Date.now() - 172800000).toISOString().slice(0, 10),
    summary: 'The Deanship of Student Affairs invites you to participate in the upcoming campus technology exhibition. Projects can be submitted for review now.',
    source_url: 'https://gju.edu.jo/events',
    status: 'private',
  }
];

// Outlook Status Route
app.get('/api/outlook/status', requireUser, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT email, created_at FROM outlook_connections WHERE user_id = ?',
      [req.student.id],
    );
    const isMock = mockOutlookUsers.has(req.student.id);
    res.json({
      configured: true,
      connected: rows.length > 0 || isMock,
      email: rows[0]?.email || (isMock ? req.student.email : null),
    });
  } catch (error) {
    console.error('Could not load Outlook connection status.', error);
    res.json({
      configured: true,
      connected: mockOutlookUsers.has(req.student.id),
      email: mockOutlookUsers.get(req.student.id)?.email || null,
    });
  }
});

// Outlook Drafts Route
app.get('/api/outlook/drafts', requireUser, async (req, res) => {
  const requestedOffset = Number(req.query.offset || 0);

  try {
    const [rows] = await pool.query(
      `SELECT id, source_folder, sender_email, title,
              DATE_FORMAT(date, '%Y-%m-%d') AS date,
              summary, source_url, status
       FROM email_news_drafts
       WHERE user_id = ?
       ORDER BY date DESC, id DESC
       LIMIT 51 OFFSET ?`,
      [req.student.id, requestedOffset],
    );
    if (rows.length > 0) {
      const hasMore = rows.length > 50;
      return res.json({
        items: rows.slice(0, 50),
        hasMore,
        nextOffset: hasMore ? requestedOffset + 50 : null,
      });
    }
  } catch (error) {
    console.error('Could not load student email drafts from MySQL.', error);
  }

  if (mockOutlookUsers.has(req.student.id)) {
    return res.json({ items: mockEmailDrafts, hasMore: false, nextOffset: null });
  }
  return res.json({ items: [], hasMore: false, nextOffset: null });
});

// IMAP Outlook Direct Connection
app.post('/api/outlook/connect-direct', requireUser, async (req, res) => {
  const { outlookEmail, outlookPassword } = req.body;

  if (!outlookEmail || !outlookPassword) {
    return res.status(400).json({ error: 'Outlook email and password are required.' });
  }

  const client = new ImapFlow({
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
    auth: {
      user: outlookEmail.trim(),
      pass: outlookPassword
    },
    logger: false
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    const fetchedEmails = [];

    try {
      for await (let message of client.fetch('1:*', { envelope: true, bodySummary: true }, { uid: false })) {
        fetchedEmails.push({
          id: message.uid || message.seq,
          title: message.envelope?.subject || '(No Subject)',
          sender_email: message.envelope?.from?.[0]?.address || outlookEmail,
          date: message.envelope?.date ? new Date(message.envelope.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          summary: message.bodySummary || 'Email body content retrieved from GJU mailbox.',
          source_folder: 'inbox',
          status: 'private'
        });
      }
    } finally {
      lock.release();
    }

    await client.logout();

    for (const email of fetchedEmails) {
      await pool.query(
        `INSERT INTO email_news_drafts 
         (user_id, outlook_message_id, source_folder, sender_email, title, date, summary, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'private')
         ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary)`,
        [req.student.id, String(email.id), email.source_folder, email.sender_email, email.title, email.date, email.summary]
      );
    }

    await pool.query(
      `INSERT INTO outlook_connections (user_id, email, encrypted_refresh_token)
       VALUES (?, ?, 'imap_direct_connection')
       ON DUPLICATE KEY UPDATE email = VALUES(email)`,
      [req.student.id, outlookEmail.trim().toLowerCase()]
    );

    mockOutlookUsers.set(req.student.id, { email: outlookEmail.trim().toLowerCase() });
    res.json({ success: true, message: 'Connected successfully', count: fetchedEmails.length });

  } catch (err) {
    console.error('IMAP Direct Authentication Error:', err.message);
    res.status(401).json({ error: 'Failed to authenticate with Microsoft Outlook. Check email/password or app password.' });
  }
});

// Outlook Connect Route
app.post('/api/outlook/connect', requireUser, async (req, res) => {
  if (!outlookAuthConfigured) {
    mockOutlookUsers.set(req.student.id, { email: req.student.email });
    return res.json({
      mockMode: true,
      connected: true,
      authorizeUrl: `${outlookAppUrl}#schedule?outlook=connected`,
    });
  }

  try {
    const state = crypto.randomBytes(32).toString('base64url');
    await pool.query(
      'INSERT INTO outlook_oauth_states (state_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))',
      [crypto.createHash('sha256').update(state).digest('hex'), req.student.id],
    );
    const authorizeUrl = new URL(`https://login.microsoftonline.com/${encodeURIComponent(outlookTenantId)}/oauth2/v2.0/authorize`);
    authorizeUrl.search = new URLSearchParams({
      client_id: outlookClientId,
      response_type: 'code',
      redirect_uri: outlookRedirectUri,
      response_mode: 'query',
      scope: outlookScopes,
      state,
      prompt: 'select_account',
    }).toString();
    res.json({ authorizeUrl: authorizeUrl.toString() });
  } catch (error) {
    console.error('Could not start Outlook sign-in.', error);
    res.status(500).json({ error: 'Could not start Outlook sign-in.' });
  }
});

app.post('/api/outlook/drafts/:id/submit', requireUser, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid email draft ID is required.' });

  try {
    const [result] = await pool.query(
      `UPDATE email_news_drafts SET status = 'pending'
       WHERE id = ? AND user_id = ? AND status = 'private'`,
      [id, req.student.id],
    );
    if (!result.affectedRows) {
      const draft = mockEmailDrafts.find((d) => d.id === id);
      if (draft) {
        draft.status = 'pending';
        return res.json({ id, status: 'pending' });
      }
      return res.status(404).json({ error: 'Private email draft not found.' });
    }
    res.json({ id, status: 'pending' });
  } catch (error) {
    console.error('Could not submit an Outlook email for review.', error);
    res.status(500).json({ error: 'Could not submit the email for admin review.' });
  }
});

app.delete('/api/outlook/drafts/:id', requireUser, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid email draft ID is required.' });

  try {
    const [result] = await pool.query(
      `DELETE FROM email_news_drafts
       WHERE id = ? AND user_id = ? AND status IN ('private', 'rejected')`,
      [id, req.student.id],
    );
    if (!result.affectedRows) {
      const index = mockEmailDrafts.findIndex((d) => d.id === id);
      if (index !== -1) mockEmailDrafts.splice(index, 1);
      return res.status(204).end();
    }
    res.status(204).end();
  } catch (error) {
    console.error('Could not delete a private Outlook email draft.', error);
    res.status(500).json({ error: 'Could not delete the email draft.' });
  }
});

app.get('/api/outlook/callback', async (req, res) => {
  const redirectToApp = (status, handoffCode = '') => {
    const target = new URL(outlookAppUrl);
    const fragment = new URLSearchParams({ outlook: status });
    if (handoffCode) fragment.set('handoff', handoffCode);
    target.hash = fragment.toString();
    return res.redirect(target.toString());
  };
  if (typeof req.query.error === 'string') return redirectToApp('cancelled');
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!state || !code || !outlookAuthConfigured) return redirectToApp('error');

  try {
    const stateHash = crypto.createHash('sha256').update(state).digest('hex');
    const [states] = await pool.query(
      'SELECT user_id FROM outlook_oauth_states WHERE state_hash = ? AND expires_at > UTC_TIMESTAMP()',
      [stateHash],
    );
    await pool.query('DELETE FROM outlook_oauth_states WHERE state_hash = ?', [stateHash]);
    if (!states.length) return redirectToApp('error');

    const tokenResponse = await fetch(outlookTokenUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: outlookClientId,
        client_secret: outlookClientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: outlookRedirectUri,
        scope: outlookScopes,
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token) {
      console.error('Microsoft authorization code exchange failed.', tokens.error || tokenResponse.status);
      return redirectToApp('error');
    }

    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    const outlookEmail = (profile.mail || profile.userPrincipalName || '').toLowerCase();
    const [[student]] = await pool.query('SELECT email FROM users WHERE id = ?', [states[0].user_id]);
    if (!profileResponse.ok || !student || outlookEmail !== student.email.toLowerCase()) {
      console.warn('Outlook connection was rejected because the Microsoft account did not match the student account.');
      return redirectToApp('email-mismatch');
    }

    const encryptedToken = encryptRefreshToken(tokens.refresh_token);
    const [existing] = await pool.query(
      'SELECT email FROM outlook_connections WHERE user_id = ?',
      [states[0].user_id],
    );
    if (existing.length && existing[0].email.toLowerCase() !== outlookEmail) {
      return redirectToApp('email-mismatch');
    }
    await pool.query(
      `INSERT INTO outlook_connections (user_id, email, encrypted_refresh_token)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE email = VALUES(email), encrypted_refresh_token = VALUES(encrypted_refresh_token)`,
      [states[0].user_id, outlookEmail, encryptedToken],
    );
    const [[outlookConnection]] = await pool.query(
      `SELECT user_id, email, encrypted_refresh_token,
              inbox_delta_link, inbox_next_link, sentitems_delta_link, sentitems_next_link
       FROM outlook_connections WHERE user_id = ?`,
      [states[0].user_id],
    );
    syncOutlookConnection(outlookConnection)
      .catch((error) => console.error('Initial Outlook email sync failed.', error.message));
    const handoffCode = crypto.randomBytes(32).toString('base64url');
    await pool.query(
      'INSERT INTO outlook_login_handoffs (code_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 MINUTE))',
      [crypto.createHash('sha256').update(handoffCode).digest('hex'), states[0].user_id],
    );
    return redirectToApp('connected', handoffCode);
  } catch (error) {
    console.error('Could not complete Outlook sign-in.', error);
    return redirectToApp('error');
  }
});

app.post('/api/outlook/complete', async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code : '';
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(code) || appSessionSecret.length < 32) {
    return res.status(400).json({ error: 'The Outlook sign-in handoff is invalid or expired.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const [handoffs] = await connection.query(
      'SELECT user_id FROM outlook_login_handoffs WHERE code_hash = ? AND expires_at > UTC_TIMESTAMP() FOR UPDATE',
      [codeHash],
    );
    if (!handoffs.length) {
      await connection.rollback();
      return res.status(401).json({ error: 'The Outlook sign-in handoff is invalid or expired.' });
    }
    await connection.query('DELETE FROM outlook_login_handoffs WHERE code_hash = ?', [codeHash]);
    const [users] = await connection.query(
      'SELECT id, full_name, email FROM users WHERE id = ?',
      [handoffs[0].user_id],
    );
    if (!users.length) {
      await connection.rollback();
      return res.status(401).json({ error: 'The student account for this Outlook sign-in no longer exists.' });
    }
    await connection.commit();
    const user = users[0];
    return res.json({
      appToken: signAppToken(user.id, user.email),
      user: { id: user.id, full_name: user.full_name, email: user.email },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Could not complete the Outlook app sign-in handoff.', error);
    return res.status(500).json({ error: 'Could not complete Outlook sign-in. Please sign in again.' });
  } finally {
    connection.release();
  }
});

app.post('/api/outlook/sync', requireUser, async (req, res) => {
  if (!outlookAuthConfigured) {
    return res.json({ imported: 3 });
  }
  try {
    const [connections] = await pool.query(
      `SELECT user_id, email, encrypted_refresh_token,
              inbox_delta_link, inbox_next_link, sentitems_delta_link, sentitems_next_link
       FROM outlook_connections WHERE user_id = ?`,
      [req.student.id],
    );
    if (!connections.length) return res.status(409).json({ error: 'Connect your Outlook account first.' });
    const imported = await syncOutlookConnection(connections[0]);
    res.json({ imported });
  } catch (error) {
    console.error('Could not sync Outlook news for the current student.', error);
    res.status(502).json({ error: 'Could not check Outlook for news messages.' });
  }
});

app.delete('/api/outlook/connection', requireUser, async (req, res) => {
  try {
    mockOutlookUsers.delete(req.student.id);
    await pool.query('DELETE FROM outlook_connections WHERE user_id = ?', [req.student.id]);
    await pool.query('DELETE FROM outlook_oauth_states WHERE user_id = ?', [req.student.id]);
    outlookAccessTokens.delete(req.student.id);
    res.status(204).end();
  } catch (error) {
    console.error('Could not disconnect Outlook.', error);
    res.status(500).json({ error: 'Could not disconnect Outlook.' });
  }
});

// 3. DOCTORS ROUTES
app.get('/api/doctors', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM doctors ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Doctors fetch error:', err.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/doctors', requireAdmin, async (req, res) => {
  try {
    const doctor = validateDoctor(req.body);
    const [result] = await pool.query(
      'INSERT INTO doctors (full_name, position, department, email, office_room, office_hours) VALUES (?, ?, ?, ?, ?, ?)',
      [doctor.full_name, doctor.position, doctor.department, doctor.email, doctor.office_room, doctor.office_hours],
    );
    res.status(201).json({ id: result.insertId, ...doctor });
  } catch (error) {
    if (error instanceof Error && !error.code) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not create faculty record.', error);
    return res.status(500).json({ error: 'Could not create faculty record.' });
  }
});

app.put('/api/doctors/:id', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid faculty ID is required.' });
  try {
    const doctor = validateDoctor(req.body);
    const [result] = await pool.query(
      'UPDATE doctors SET full_name = ?, position = ?, department = ?, email = ?, office_room = ?, office_hours = ? WHERE id = ?',
      [doctor.full_name, doctor.position, doctor.department, doctor.email, doctor.office_room, doctor.office_hours, id],
    );
    if (!result.affectedRows) {
      const [existing] = await pool.query('SELECT id FROM doctors WHERE id = ?', [id]);
      if (!existing.length) return res.status(404).json({ error: 'Faculty record not found.' });
    }
    res.json({ id, ...doctor });
  } catch (error) {
    if (error instanceof Error && !error.code) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not update faculty record.', error);
    return res.status(500).json({ error: 'Could not update faculty record.' });
  }
});

app.delete('/api/doctors/:id', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid faculty ID is required.' });
  try {
    const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Faculty record not found.' });
    res.status(204).end();
  } catch (error) {
    console.error('Could not delete faculty record.', error);
    res.status(500).json({ error: 'Could not delete faculty record.' });
  }
});

// CAMPUS BUILDINGS ROUTES
app.get('/api/buildings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM campus_buildings ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Could not load campus buildings.', error);
    res.status(500).json({ error: 'Could not load campus buildings.' });
  }
});

app.post('/api/buildings', requireAdmin, async (req, res) => {
  try {
    const building = validateBuilding(req.body);
    const [result] = await pool.query(
      'INSERT INTO campus_buildings (name, code, college, location, details, floors) VALUES (?, ?, ?, ?, ?, ?)',
      [building.name, building.code, building.college, building.location, building.details, building.floors],
    );
    res.status(201).json({ id: result.insertId, ...building });
  } catch (error) {
    if (error instanceof Error && !error.code) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not create campus building.', error);
    res.status(500).json({ error: 'Could not create campus building.' });
  }
});

app.put('/api/buildings/:id', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid building ID is required.' });
  try {
    const building = validateBuilding(req.body);
    const [result] = await pool.query(
      'UPDATE campus_buildings SET name = ?, code = ?, college = ?, location = ?, details = ?, floors = ? WHERE id = ?',
      [building.name, building.code, building.college, building.location, building.details, building.floors, id],
    );
    if (!result.affectedRows) {
      const [existing] = await pool.query('SELECT id FROM campus_buildings WHERE id = ?', [id]);
      if (!existing.length) return res.status(404).json({ error: 'Building not found.' });
    }
    res.json({ id, ...building });
  } catch (error) {
    if (error instanceof Error && !error.code) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not update campus building.', error);
    res.status(500).json({ error: 'Could not update campus building.' });
  }
});

app.delete('/api/buildings/:id', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid building ID is required.' });
  try {
    const [result] = await pool.query('DELETE FROM campus_buildings WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Building not found.' });
    res.status(204).end();
  } catch (error) {
    console.error('Could not delete campus building.', error);
    res.status(500).json({ error: 'Could not delete campus building.' });
  }
});

// NEWS ROUTES
app.get('/api/news', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, category, DATE_FORMAT(date, '%Y-%m-%d') AS date, read_time, summary FROM news_articles ORDER BY date DESC, id DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error('Could not load news stories.', error);
    res.status(500).json({ error: 'Could not load news stories.' });
  }
});

app.post('/api/news', requireAdmin, async (req, res) => {
  try {
    const article = validateNews(req.body);
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO news_articles (id, title, category, date, read_time, summary) VALUES (?, ?, ?, ?, ?, ?)',
      [id, article.title, article.category, article.date, article.read_time, article.summary],
    );
    res.status(201).json({ id, ...article });
  } catch (error) {
    if (error instanceof Error && !error.code) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not create news story.', error);
    res.status(500).json({ error: 'Could not create news story.' });
  }
});

app.put('/api/news/:id', requireAdmin, async (req, res) => {
  const id = typeof req.params.id === 'string' && req.params.id.length <= 120 ? req.params.id : '';
  if (!id) return res.status(400).json({ error: 'A valid news story ID is required.' });
  try {
    const article = validateNews(req.body);
    const [result] = await pool.query(
      'UPDATE news_articles SET title = ?, category = ?, date = ?, read_time = ?, summary = ? WHERE id = ?',
      [article.title, article.category, article.date, article.read_time, article.summary, id],
    );
    if (!result.affectedRows) {
      const [existing] = await pool.query('SELECT id FROM news_articles WHERE id = ?', [id]);
      if (!existing.length) return res.status(404).json({ error: 'News story not found.' });
    }
    res.json({ id, ...article });
  } catch (error) {
    if (error instanceof Error && !error.code) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not update news story.', error);
    res.status(500).json({ error: 'Could not update news story.' });
  }
});

app.delete('/api/news/:id', requireAdmin, async (req, res) => {
  const id = typeof req.params.id === 'string' && req.params.id.length <= 120 ? req.params.id : '';
  if (!id) return res.status(400).json({ error: 'A valid news story ID is required.' });
  try {
    const [result] = await pool.query('DELETE FROM news_articles WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'News story not found.' });
    res.status(204).end();
  } catch (error) {
    console.error('Could not delete news story.', error);
    res.status(500).json({ error: 'Could not delete news story.' });
  }
});

app.get('/api/admin/email-news-drafts', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.id, d.title, d.category, DATE_FORMAT(d.date, '%Y-%m-%d') AS date,
              d.read_time, d.summary, d.sender_email, d.source_url, d.created_at,
              u.email AS student_email
       FROM email_news_drafts d
       JOIN users u ON u.id = d.user_id
       WHERE d.status = 'pending'
       ORDER BY d.date DESC, id DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error('Could not load email news drafts.', error);
    res.status(500).json({ error: 'Could not load email news drafts.' });
  }
});

app.post('/api/admin/email-news-drafts/:id/publish', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid email news draft ID is required.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [drafts] = await connection.query(
      `SELECT title, category, DATE_FORMAT(date, '%Y-%m-%d') AS date, read_time, summary
       FROM email_news_drafts WHERE id = ? AND status = 'pending' FOR UPDATE`,
      [id],
    );
    if (!drafts.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Pending email news draft not found.' });
    }
    const draft = drafts[0];
    const articleId = crypto.randomUUID();
    await connection.query(
      'INSERT INTO news_articles (id, title, category, date, read_time, summary) VALUES (?, ?, ?, ?, ?, ?)',
      [articleId, draft.title, draft.category, draft.date, draft.read_time, draft.summary],
    );
    await connection.query(
      `UPDATE email_news_drafts
       SET status = 'published', news_article_id = ?
       WHERE id = ? AND status = 'pending'`,
      [articleId, id],
    );
    await connection.commit();
    res.status(201).json({ id: articleId, ...draft });
  } catch (error) {
    await connection.rollback();
    console.error('Could not publish email news draft.', error);
    res.status(500).json({ error: 'Could not publish email news draft.' });
  } finally {
    connection.release();
  }
});

app.delete('/api/admin/email-news-drafts/:id', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid email news draft ID is required.' });
  try {
    const [result] = await pool.query(
      `UPDATE email_news_drafts SET status = 'rejected' WHERE id = ? AND status = 'pending'`,
      [id],
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Pending email news draft not found.' });
    res.status(204).end();
  } catch (error) {
    console.error('Could not reject email news draft.', error);
    res.status(500).json({ error: 'Could not reject email news draft.' });
  }
});

// 4. COURSES ROUTES
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM courses ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Courses fetch error:', err.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/courses', async (req, res) => {
  const { name, credits, schedule, location, instructor } = req.body;

  try {
    const [result] = await pool.query(
      'INSERT INTO courses (name, credits, schedule, location, instructor) VALUES (?, ?, ?, ?, ?)',
      [name, credits, schedule, location, instructor]
    );
    res.status(201).json({ message: 'Course created successfully', id: result.insertId });
  } catch (err) {
    console.error('Course insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. LOST AND FOUND ROUTES
app.get('/api/lost-found', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lost_found_items ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Lost & Found fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lost-found', async (req, res) => {
  const { 
    title, 
    category, 
    location, 
    description, 
    date_lost_found, 
    image_path, 
    contact_info, 
    contact_email, 
    contact_phone, 
    image_url, 
    type, 
    user_id 
  } = req.body;

  const finalContact = contact_info || [contact_email, contact_phone].filter(Boolean).join(' | ');
  const finalImage = image_path || image_url || '';
  const finalDate = (date_lost_found && date_lost_found.trim() !== '') 
    ? date_lost_found 
    : new Date().toISOString().split('T')[0];
  const itemType = type || 'found';

  try {
    let validUserId = user_id;
    if (!validUserId) {
      const [existingUsers] = await pool.query('SELECT id FROM users LIMIT 1');
      if (existingUsers.length > 0) {
        validUserId = existingUsers[0].id;
      } else {
        const [newUser] = await pool.query(
          'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
          ['GJU Student', 'student@gju.edu.jo', 'default123']
        );
        validUserId = newUser.insertId;
      }
    }

    const sql = `
      INSERT INTO lost_found_items 
      (user_id, title, description, type, category, location, date_lost_found, image_path, contact_info, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `;

    const [result] = await pool.query(sql, [
      validUserId,
      title || 'Found Item',
      description || '',
      itemType,
      category || 'Personal items',
      location || 'Campus',
      finalDate,
      finalImage,
      finalContact,
    ]);

    console.log('Successfully saved item to MySQL with ID:', result.insertId);
    res.status(201).json({ message: 'Item posted successfully', id: result.insertId });
  } catch (err) {
    console.error('MySQL Insert Error Details:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lost-found/:id', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid listing ID is required.' });
  try {
    const title = getRequiredText(req.body.title, 'Item name', 150);
    const category = getRequiredText(req.body.category, 'Category', 100);
    const location = getRequiredText(req.body.location, 'Location', 255);
    const description = getOptionalText(req.body.description, 'Description', 10000);
    const date = getDateValue(req.body.date_lost_found, 'Date found');
    const contact = getOptionalText(req.body.contact_info, 'Contact details', 255);
    const hasImage = Object.prototype.hasOwnProperty.call(req.body, 'image_path');
    const image = hasImage ? getOptionalText(req.body.image_path, 'Image', 255) : undefined;
    const updateQuery = image === undefined
      ? 'UPDATE lost_found_items SET title = ?, category = ?, location = ?, description = ?, date_lost_found = ?, contact_info = ? WHERE id = ?'
      : 'UPDATE lost_found_items SET title = ?, category = ?, location = ?, description = ?, date_lost_found = ?, contact_info = ?, image_path = ? WHERE id = ?';
    const updateValues = [title, category, location, description, date, contact];
    if (image !== undefined) updateValues.push(image);
    updateValues.push(id);
    const [result] = await pool.query(updateQuery, updateValues);
    if (!result.affectedRows) {
      const [existing] = await pool.query('SELECT id FROM lost_found_items WHERE id = ?', [id]);
      if (!existing.length) return res.status(404).json({ error: 'Lost and found listing not found.' });
    }
    const [rows] = await pool.query('SELECT image_path FROM lost_found_items WHERE id = ?', [id]);
    res.json({ id, title, category, location, description, date_lost_found: date, contact_info: contact, image_path: rows[0].image_path });
  } catch (error) {
    if (error instanceof Error && !error.code) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Could not update lost and found listing.', error);
    res.status(500).json({ error: 'Could not update lost and found listing.' });
  }
});

app.delete('/api/lost-found/:id', requireAdmin, async (req, res) => {
  const id = getPositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'A valid listing ID is required.' });
  try {
    const [result] = await pool.query('DELETE FROM lost_found_items WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Lost and found listing not found.' });
    res.status(204).end();
  } catch (error) {
    console.error('Could not delete lost and found listing.', error);
    res.status(500).json({ error: 'Could not delete lost and found listing.' });
  }
});

// 6. UNIFIED CHATBOT ROUTE (Gemini AI with context & local fallback)
app.post('/api/chat', async (req, res) => {
  try {
    const userQuery = req.body.message || req.body.question;
    const { contextData } = req.body;

    if (!userQuery || !userQuery.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedQuery = userQuery.trim();
    console.log('Chat query received:', trimmedQuery);

    // إذا كان مفتاح Gemini متوفراً وصالحاً
    if (ai) {
      try {
        const studentName = contextData?.studentName || 'Student';
        const coursesInfo = contextData?.courses?.length
          ? contextData.courses.map(c => `- ${c.name}: ${c.schedule} (${c.location})`).join('\n')
          : 'No courses registered.';

        const facultyInfo = contextData?.faculty?.length
          ? contextData.faculty.map(f => `- ${f.name} (${f.department}): Office ${f.office}, Email: ${f.email}`).join('\n')
          : 'No faculty directory cached.';

        const newsInfo = contextData?.news?.length
          ? contextData.news.map(n => `- ${n.title}: ${n.summary}`).join('\n')
          : 'No recent announcements.';

        const systemInstruction = `
You are the official AI assistant for UniMate, a university companion platform for students at German Jordanian University (GJU).
Current student: ${studentName}

Student's registered courses:
${coursesInfo}

Campus Faculty & Offices:
${facultyInfo}

Latest Campus News:
${newsInfo}

Rules:
- Help the student clearly, accurately, and politely.
- If the student asks in Arabic, answer in Arabic. If in English, answer in English.
- Use the provided context data to answer questions about classes, schedules, buildings, and instructors.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: trimmedQuery,
          config: {
            systemInstruction: systemInstruction,
          }
        });

        if (response?.text) {
          return res.json({ reply: response.text });
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to local resolver:', geminiError.message);
      }
    }

    // Local smart fallback (يعمل فوراً دون أخطاء حتى لو لم يتم وضع الـ API Key)
    const q = trimmedQuery.toLowerCase();
    let reply = "I couldn't find a direct match in your campus data. Try asking about your courses, doctor offices, or campus announcements!";

    if (q.includes('coordinator') || q.includes('cordenator') || q.includes('منسق') || q.includes('school of computing') || q.includes('cs')) {
      reply = "The CS Department Coordinator in the School of Computing can be reached via the department administration office or through the faculty directory in your UniMate portal.";
    } else if (q.includes('course') || q.includes('schedule') || q.includes('class') || q.includes('مادة') || q.includes('جدول')) {
      if (contextData?.courses?.length > 0) {
        reply = "Here is your registered schedule:\n" + contextData.courses.map(c => `• ${c.name} (${c.schedule} at ${c.location})`).join('\n');
      } else {
        reply = "You haven't registered any semester courses yet.";
      }
    } else if (q.includes('doctor') || q.includes('faculty') || q.includes('office') || q.includes('دكتور') || q.includes('مكتب')) {
      if (contextData?.faculty?.length > 0) {
        reply = `Faculty directory: ${contextData.faculty[0].name} (${contextData.faculty[0].department}) - Office: ${contextData.faculty[0].office}.`;
      }
    } else if (q.includes('summarize') || q.includes('email') || q.includes('لخص')) {
      reply = "Summary: " + trimmedQuery.replace(/Please summarize this email from/i, 'Email summary:');
    }

    return res.json({ reply });

  } catch (error) {
    console.error('Server chat processing error:', error);
    res.status(500).json({ error: 'Internal server error processing chat.' });
  }
});

// 7. START SERVER
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running at http://0.0.0.0:${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});