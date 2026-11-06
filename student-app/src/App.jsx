import EmailsTab from './EmailsTab';
import ChatbotWidget from './ChatbotWidget';
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import universityLogo from './assets/gju-symbol.svg';
import { supabase } from './supabase.js';

export default function App() {
  const [mode, setMode] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [screen, setScreen] = useState('auth');
  const [studentName, setStudentName] = useState('Student');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [userToken, setUserToken] = useState('');
  const hasOutlookHandoff = Boolean(new URLSearchParams(window.location.hash.slice(1)).get('handoff'));
  const outlookHandoffPending = useRef(hasOutlookHandoff);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isPreviewSession, setIsPreviewSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(supabase || hasOutlookHandoff));
  const [dashboardMessage, setDashboardMessage] = useState(() => {
    const callback = new URLSearchParams(window.location.hash.slice(1));
    const status = callback.get('outlook');
    if (status === 'email-mismatch') return 'Connect the Microsoft Outlook account that uses your GJU sign-in email.';
    if (status === 'cancelled') return 'Outlook connection was cancelled.';
    if (status === 'error' || (status === 'connected' && !callback.get('handoff'))) {
      return 'Could not connect Outlook. Please try again.';
    }
    return '';
  });
  const isSignIn = mode === 'signin';

  useEffect(() => {
    const callback = new URLSearchParams(window.location.hash.slice(1));
    const outlookStatus = callback.get('outlook');
    const handoff = callback.get('handoff');
    if (!outlookStatus) return;

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    if (outlookStatus !== 'connected' || !handoff) {
      return;
    }

    let isMounted = true;
    fetch('http://localhost:5000/api/outlook/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: handoff }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not finish Outlook sign-in.');
      if (!isMounted) return;
      const name = result.user?.full_name || result.user?.email?.split('@')[0] || 'Student';
      setStudentName(name.trim().split(/[._-]/)[0] || 'Student');
      setUserToken(result.appToken || '');
      setIsAdmin(false);
      setAdminToken('');
      setDashboardMessage('Outlook connected. Matching sent emails will be added to the admin review queue.');
      setScreen('home');
    }).catch((error) => {
      if (!isMounted) return;
      console.error('Could not complete Outlook sign-in.', error);
      setDashboardMessage(error.message || 'Could not finish Outlook sign-in. Please sign in again.');
    }).finally(() => {
      if (isMounted) {
        outlookHandoffPending.current = false;
        setIsCheckingSession(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    let isMounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error('Could not restore the Supabase session.', error);
        setMessage('Could not check your saved sign-in. Please sign in again.');
      } else if (data.session) {
        const name = data.session.user.user_metadata.full_name
          || data.session.user.email?.split('@')[0]
          || 'Student';
        setStudentName(name.trim().split(/[._-]/)[0] || 'Student');
        setScreen('home');
      }
      if (!outlookHandoffPending.current) setIsCheckingSession(false);
    }).catch((error) => {
      if (!isMounted) return;
      console.error('Could not read the saved Supabase session.', error);
      setMessage('Could not check your saved sign-in. Please sign in again.');
      if (!outlookHandoffPending.current) setIsCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && isMounted) {
        setIsAdmin(false);
        setAdminToken('');
        setUserToken('');
        setScreen('auth');
        setMode('signin');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setVerificationEmail('');
    setMessage('');
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (verificationEmail) {
      const code = formData.get('verificationCode').trim();
      if (!supabase) {
        setMessage('Supabase is not configured. Add the project URL and publishable key to .env.local.');
        return;
      }

      setIsSubmitting(true);
      setMessage('');
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: verificationEmail,
          token: code,
          type: 'signup',
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        if (!data.session) {
          setMessage('The code was accepted, but no signed-in session was returned. Please try signing in.');
          return;
        }

        const name = data.user.user_metadata.full_name || verificationEmail.split('@')[0];
        setStudentName(name.trim().split(/[._-]/)[0] || 'Student');
        setIsAdmin(false);
        setAdminToken('');
        setUserToken('');
        setVerificationEmail('');
        setScreen('home');
      } catch (error) {
        console.error('Could not verify the signup code.', error);
        setMessage('Could not verify the code. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const email = formData.get('email').trim();
    const emailParts = email.toLowerCase().split('@');
    if (emailParts.length !== 2 || emailParts[1] !== 'gju.edu.jo') {
      setMessage('Please use your GJU email address ending in @gju.edu.jo.');
      return;
    }

    if (!isSignIn && formData.get('password') !== formData.get('confirmPassword')) {
      setMessage('Passwords do not match. Please check them and try again.');
      return;
    }

    // --- 1. SIGN UP (CREATE ACCOUNT) INTO MYSQL ---
    if (!isSignIn) {
      setIsSubmitting(true);
      setMessage('');
      try {
        const res = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: formData.get('name')?.trim() || '',
            email: email,
            password: formData.get('password'),
          }),
        });

        const resData = await res.json();

        if (!res.ok) {
          setMessage(resData.error || 'Failed to register account in MySQL.');
          setIsSubmitting(false);
          return;
        }

        const name = formData.get('name')?.trim() || email.split('@')[0];
        setStudentName(name.trim().split(/[._-]/)[0] || 'Student');
        setIsAdmin(false);
        setAdminToken('');
        setScreen('home');
        setUserToken(resData.appToken || '');
        setIsSubmitting(false);
        return;
      } catch (error) {
        console.error('Could not connect to backend server on port 5000.', error);
        setMessage('Backend server unreachable. Make sure node server.js is running on port 5000.');
        setIsSubmitting(false);
        return;
      }
    }

    // --- 2. SIGN IN (AUTHENTICATE AGAINST MYSQL) ---
    if (isSignIn) {
      setIsSubmitting(true);
      setMessage('');
      try {
        const res = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: formData.get('password'),
          }),
        });

        const resData = await res.json();

        if (!res.ok) {
          setMessage(resData.error || 'Invalid email or password.');
          setIsSubmitting(false);
          return;
        }

        const name = resData.user?.full_name || email.split('@')[0];
        setStudentName(name.trim().split(/[._-]/)[0] || 'Student');
        setIsAdmin(resData.role === 'admin');
        setAdminToken(resData.role === 'admin' ? resData.adminToken : '');
        setUserToken(resData.appToken || '');
        setScreen('home');
        setIsSubmitting(false);
        return;
      } catch (error) {
        console.error('Could not connect to backend server on port 5000.', error);
        setMessage('Backend server unreachable. Make sure node server.js is running on port 5000.');
        setIsSubmitting(false);
        return;
      }
    }
  };

  const resendVerificationCode = async () => {
    if (!supabase || !verificationEmail) {
      setMessage('Supabase is not configured. Add the project URL and publishable key to .env.local.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(`A new verification code was sent to ${verificationEmail}.`);
    } catch (error) {
      console.error('Could not resend the signup verification code.', error);
      setMessage('Could not resend the verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return <main className="auth-loading" aria-live="polite">Checking your sign-in…</main>;
  }

  if (screen === 'home') {
    return (
      <Dashboard
        studentName={studentName}
        isAdmin={isAdmin}
        adminToken={adminToken}
        userToken={userToken}
        authMessage={dashboardMessage}
        isPreviewSession={isPreviewSession}
        onSignOut={async () => {
          if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) {
              console.error('Could not sign out of Supabase.', error);
              setDashboardMessage('Could not sign out. Please try again.');
              return;
            }
          }
          setIsPreviewSession(false);
          setIsAdmin(false);
          setAdminToken('');
          setUserToken('');
          setDashboardMessage('');
          setScreen('auth');
          setMode('signin');
          setMessage('');
        }}
      />
    );
  }

  return (
    <main className="auth-page" dir="ltr">
      <section className="welcome-panel" aria-label="About UniMate">
        <div className="brand" aria-label="UniMate for German Jordanian University students">
          <span className="university-logo-frame">
            <img src={universityLogo} alt="German Jordanian University logo" />
          </span>
          <span>UniMate</span>
        </div>

        <div className="welcome-copy">
          <span className="eyebrow">YOUR ACADEMIC SPACE</span>
          <h1>Everything you need for your university journey, all in one place.</h1>
          <p>
            Organize your day, keep track of your tasks, and give your academic goals the space they deserve.
          </p>
        </div>

        <div className="welcome-note">
          <span className="note-icon" aria-hidden="true">✳</span>
          <p>A small step today can make a big difference tomorrow.</p>
        </div>
        <span className="decorative-orbit orbit-one" aria-hidden="true" />
        <span className="decorative-orbit orbit-two" aria-hidden="true" />
      </section>

      <section className="form-panel" aria-labelledby="form-heading">
        <div className="mobile-brand" aria-label="UniMate for German Jordanian University students">
          <span className="university-logo-frame">
            <img src={universityLogo} alt="German Jordanian University logo" />
          </span>
          <span>UniMate</span>
        </div>

        <div className="auth-card">
          <div className="form-heading">
            <span className="eyebrow">
              {verificationEmail ? 'EMAIL VERIFICATION' : isSignIn ? 'WELCOME BACK' : 'GET STARTED'}
            </span>
            <h2 id="form-heading">
              {verificationEmail
                ? 'Verify your GJU email'
                : isSignIn ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p>
              {verificationEmail
                ? `Enter the six-digit code sent to ${verificationEmail}.`
                : isSignIn
                  ? 'Enter your details to continue to your study space.'
                  : 'Create a new account and start organizing your university life.'}
            </p>
          </div>

          {!supabase && !verificationEmail && (
            <p className="auth-preview-notice" role="note">
              Connected to local database. Authentication is verified through MySQL.
            </p>
          )}

          {!verificationEmail && (
            <div className="mode-switch" role="tablist" aria-label="Account type">
              <button
                className={isSignIn ? 'mode-tab active' : 'mode-tab'}
                type="button"
                role="tab"
                aria-selected={isSignIn}
                onClick={() => switchMode('signin')}
              >
                Sign in
              </button>
              <button
                className={!isSignIn ? 'mode-tab active' : 'mode-tab'}
                type="button"
                role="tab"
                aria-selected={!isSignIn}
                onClick={() => switchMode('signup')}
              >
                Create account
              </button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {verificationEmail ? (
              <label className="field">
                <span>Verification code</span>
                <input
                  type="text"
                  name="verificationCode"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  required
                />
              </label>
            ) : (
              <>
                {!isSignIn && (
                  <label className="field">
                    <span>Full name</span>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="e.g. Sarah Ahmed"
                      required
                    />
                  </label>
                )}

                <label className="field">
                  <span>Email address</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="name@gju.edu.jo"
                    dir="ltr"
                    required
                  />
                  <small className="field-hint">Use your GJU email address ending in @gju.edu.jo.</small>
                </label>

                <label className="field">
                  <span>Password</span>
                  <span className="password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete={isSignIn ? 'current-password' : 'new-password'}
                      placeholder={isSignIn ? 'Enter your password' : 'At least 8 characters'}
                      minLength={isSignIn ? undefined : 8}
                      required
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </span>
                </label>

                {!isSignIn && (
                  <label className="field">
                    <span>Confirm password</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      minLength={8}
                      required
                    />
                  </label>
                )}

                {isSignIn && (
                  <label className="remember-option">
                    <input type="checkbox" name="remember" />
                    <span>Remember me on this device</span>
                  </label>
                )}
              </>
            )}

            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}

            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait…'
                : verificationEmail ? 'Verify email' : isSignIn ? 'Sign in' : 'Create account'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          {verificationEmail ? (
            <div className="verification-actions">
              <button className="text-button" type="button" onClick={resendVerificationCode} disabled={isSubmitting}>
                Resend code
              </button>
              <button className="text-button" type="button" onClick={() => switchMode('signup')} disabled={isSubmitting}>
                Back to sign up
              </button>
            </div>
          ) : (
            <p className="form-footer">
              {isSignIn ? 'New to UniMate?' : 'Already have an account?'}{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => switchMode(isSignIn ? 'signup' : 'signin')}
              >
                {isSignIn ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          )}
        </div>

        <p className="legal-note">
          By continuing, you agree to our Terms of Use and Privacy Policy.
        </p>
      </section>
    </main>
  );
}

const campusBuildings = [
  {
    name: 'Main Academic Building',
    code: 'A · CENTRAL CAMPUS',
    college: 'School of Computing and Informatics',
    location: 'Main campus, near the central courtyard',
    details: 'Lecture rooms, student services, and faculty offices.',
    floors: '4 floors',
  },
  {
    name: 'Engineering & Design Building',
    code: 'B · CENTRAL CAMPUS',
    college: 'School of Architecture and Built Environment',
    location: 'Main campus, east side',
    details: 'Design studios, engineering labs, and project spaces.',
    floors: '3 floors',
  },
  {
    name: 'Business and Languages Building',
    code: 'C · CENTRAL CAMPUS',
    college: 'School of Management and Logistics',
    location: 'Main campus, beside the library',
    details: 'Classrooms, seminar rooms, and faculty offices.',
    floors: '3 floors',
  },
];

const facultyDirectory = [
  {
    name: 'Dr. Lina Haddad',
    title: 'Associate Professor',
    college: 'School of Computing and Informatics',
    department: 'Computer Science',
    office: 'Main Academic Building · Office A-214',
    email: 'faculty1@example.com',
  },
  {
    name: 'Dr. Samir Nasser',
    title: 'Assistant Professor',
    college: 'School of Architecture and Built Environment',
    department: 'Architecture',
    office: 'Engineering & Design Building · Office B-108',
    email: 'faculty2@example.com',
  },
  {
    name: 'Dr. Maya Khalil',
    title: 'Professor',
    college: 'School of Management and Logistics',
    department: 'Business Administration',
    office: 'Business and Languages Building · Office C-302',
    email: 'faculty3@example.com',
  },
];

const demoBuses = [
  {
    id: 'route-one',
    name: 'Campus Shuttle 01',
    route: 'Madaba Gate → GJU Campus',
    status: 'On route',
    arrival: '8 min',
    latitude: 31.7158,
    longitude: 35.8004,
    nextStop: 'South Campus Entrance',
    lastUpdated: 'Just now · demo location',
    stops: [
      { name: 'Madaba Gate', time: 'Departed' },
      { name: 'South Campus Entrance', time: '8 min' },
      { name: 'Main Academic Building', time: '13 min' },
      { name: 'Student Center', time: '17 min' },
    ],
  },
  {
    id: 'route-two',
    name: 'Campus Shuttle 02',
    route: 'Amman South → GJU Campus',
    status: 'On route',
    arrival: '14 min',
    latitude: 31.723,
    longitude: 35.808,
    nextStop: 'Engineering Building',
    lastUpdated: 'Just now · demo location',
    stops: [
      { name: 'Amman South Station', time: 'Departed' },
      { name: 'Highway Checkpoint', time: '6 min' },
      { name: 'Engineering Building', time: '14 min' },
      { name: 'Student Center', time: '19 min' },
    ],
  },
  {
    id: 'route-three',
    name: 'Campus Shuttle 03',
    route: 'Dormitories → GJU Campus',
    status: 'On route',
    arrival: '5 min',
    latitude: 31.7098,
    longitude: 35.7942,
    nextStop: 'North Campus Entrance',
    lastUpdated: 'Just now · demo location',
    stops: [
      { name: 'Student Dormitories', time: 'Departed' },
      { name: 'North Campus Entrance', time: '5 min' },
      { name: 'Library', time: '10 min' },
      { name: 'Main Academic Building', time: '14 min' },
    ],
  },
];

const sampleGjuNews = [
  {
    id: 'research-spotlight',
    title: 'Student research takes the spotlight at GJU',
    category: 'Research',
    date: '2026-10-20',
    readTime: '4 min read',
    summary: 'A look at how students are turning classroom ideas into projects with the potential to make a difference.',
    featured: true,
  },
  {
    id: 'campus-community',
    title: 'A campus community built on exchange',
    category: 'Campus life',
    date: '2026-10-18',
    readTime: '3 min read',
    summary: 'Students share the experiences, traditions, and ideas that make campus life at GJU unique.',
  },
  {
    id: 'learning-innovation',
    title: 'New approaches to learning and innovation',
    category: 'Academics',
    date: '2026-10-15',
    readTime: '5 min read',
    summary: 'Inside the ideas and collaborations helping students connect academic learning with real-world challenges.',
  },
  {
    id: 'student-opportunities',
    title: 'Making the most of opportunities beyond the classroom',
    category: 'Student stories',
    date: '2026-10-12',
    readTime: '3 min read',
    summary: 'GJU students talk about the experiences that helped them grow their skills and discover new interests.',
  },
  {
    id: 'sustainability',
    title: 'Small ideas for a more sustainable campus',
    category: 'Campus life',
    date: '2026-10-08',
    readTime: '2 min read',
    summary: 'Students and staff consider practical ways to make everyday campus life more sustainable.',
  },
];

const sampleEmailNews = [
  {
    id: 'email-career-workshop',
    title: 'Career preparation workshop announced for students',
    category: 'Student stories',
    date: '2026-10-22',
    readTime: '2 min read',
    summary: 'A sample email announcement highlights an upcoming workshop to help students prepare for their next career step.',
    emailSource: true,
  },
  {
    id: 'email-research-opportunity',
    title: 'Student research opportunity now accepting applications',
    category: 'Research',
    date: '2026-10-21',
    readTime: '3 min read',
    summary: 'A sample announcement shares a research opportunity and invites interested students to learn more.',
    emailSource: true,
  },
];

const getLocalDateString = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const formatFoundDate = (value) => {
  if (!value || value === 'Recently') return value || 'Recently';

  const dateParts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateParts
    ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const month = new Intl.DateTimeFormat('en', { month: 'long' }).format(date);
  return `${date.getDate()} ${month}, ${date.getFullYear()}`;
};

const getDateTimestamp = (value) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const normalizeCollegeName = (value) => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return /^school of computing \(sc\)$/i.test(normalized)
    ? 'School of Computing (SC)'
    : normalized;
};

const mapDoctorRecord = (record) => {
  const department = normalizeCollegeName(record.department || '');
  return {
    ...record,
    name: (record.name || record.full_name || 'Dr. Faculty Member').trim(),
    title: (record.title || record.position || 'Professor').trim(),
    college: normalizeCollegeName(record.college || department || 'School of Computing and Informatics'),
    department: department || 'Computer Science',
    office: (record.office || record.office_room || 'Main Campus').trim(),
    email: (record.email || '').trim(),
    officeHours: (record.officeHours || record.office_hours || '').trim(),
  };
};

const mapBuildingRecord = (record) => ({
  ...record,
  name: record.name || '',
  code: record.code || '',
  college: normalizeCollegeName(record.college || ''),
  location: record.location || '',
  details: record.details || '',
  floors: record.floors || '',
});

const mapNewsRecord = (record) => ({
  ...record,
  date: typeof record.date === 'string' ? record.date.slice(0, 10) : '',
  readTime: record.readTime || record.read_time || '',
  emailSource: Boolean(record.emailSource),
});

const mapLostFoundRecord = (record) => {
  const contacts = (record.contact_info || '').split('|').map((contact) => contact.trim());
  return {
    ...record,
    title: record.title || '',
    category: record.category || 'Personal items',
    location: record.location || 'Campus',
    date: record.date_lost_found
      ? String(record.date_lost_found).slice(0, 10)
      : record.created_at
        ? String(record.created_at).slice(0, 10)
        : 'Recently',
    description: record.description || '',
    email: contacts.find((contact) => contact.includes('@')) || record.email || '',
    phone: contacts.find((contact) => !contact.includes('@') && contact) || record.phone || '',
    image: record.image_path || record.image || '',
  };
};

const adminFields = {
  faculty: [
    { name: 'full_name', label: 'Name', required: true, maxLength: 100 },
    { name: 'position', label: 'Title', required: true, maxLength: 100 },
    { name: 'department', label: 'School or department', required: true, maxLength: 100 },
    { name: 'email', label: 'Email (optional)', type: 'email', maxLength: 100 },
    { name: 'office_room', label: 'Office', maxLength: 50 },
    { name: 'office_hours', label: 'Office hours', maxLength: 100 },
  ],
  building: [
    { name: 'name', label: 'Building name', required: true, maxLength: 150 },
    { name: 'code', label: 'Building code', required: true, maxLength: 80 },
    { name: 'college', label: 'School', required: true, maxLength: 150 },
    { name: 'location', label: 'Location', required: true, maxLength: 255 },
    { name: 'details', label: 'Details', type: 'textarea', required: true, maxLength: 1000 },
    { name: 'floors', label: 'Floors', required: true, maxLength: 50 },
  ],
  news: [
    { name: 'title', label: 'Headline', required: true, maxLength: 200 },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: ['Academics', 'Campus life', 'Research', 'Student stories', 'Announcements'],
    },
    { name: 'date', label: 'Publication date', type: 'date', required: true },
    { name: 'read_time', label: 'Read time', required: true, maxLength: 40 },
    { name: 'summary', label: 'Story', type: 'textarea', required: true, maxLength: 2000 },
  ],
};

function AdminEditor({ title, fields, initialValues, onSave, onCancel, saving }) {
  return (
    <form className="admin-editor" onSubmit={onSave}>
      <div className="admin-editor-heading">
        <h3>{title}</h3>
        <button className="course-cancel-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
      <div className="admin-editor-fields">
        {fields.map((field) => (
          <label className={field.type === 'textarea' ? 'admin-editor-wide' : ''} key={field.name}>
            <span>{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea
                name={field.name}
                required={field.required}
                maxLength={field.maxLength}
                defaultValue={initialValues[field.name] || ''}
                rows="4"
              />
            ) : field.type === 'select' ? (
              <select name={field.name} required={field.required} defaultValue={initialValues[field.name] || field.options[0]}>
                {initialValues[field.name] && !field.options.includes(initialValues[field.name]) && (
                  <option>{initialValues[field.name]}</option>
                )}
                {field.options.map((option) => <option key={option}>{option}</option>)}
              </select>
            ) : (
              <input
                name={field.name}
                type={field.type || 'text'}
                required={field.required}
                maxLength={field.maxLength}
                defaultValue={initialValues[field.name] || ''}
              />
            )}
          </label>
        ))}
      </div>
      <button className="post-item-button" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function Dashboard({ studentName, isAdmin, adminToken, userToken, onSignOut, authMessage, isPreviewSession }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [semesterCourses, setSemesterCourses] = useState(() => {
    try {
      const savedCourses = window.localStorage.getItem('unimate.semesterCourses.v1');
      const parsedCourses = savedCourses ? JSON.parse(savedCourses) : [];
      return Array.isArray(parsedCourses)
        ? parsedCourses.filter((course) => (
          course
          && typeof course.id === 'string'
          && typeof course.name === 'string'
          && Number.isFinite(course.credits)
          && typeof course.schedule === 'string'
          && typeof course.location === 'string'
          && typeof course.instructor === 'string'
        ))
        : [];
    } catch (error) {
      console.error('Could not load saved semester courses.', error);
      return [];
    }
  });

  const fetchCoursesFromBackend = () => {
    fetch('http://localhost:5000/api/courses')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((c) => ({
            id: String(c.id || c.course_id),
            name: c.name || c.title || c.course_name,
            credits: Number(c.credits || c.credit_hours || 3),
            schedule: c.schedule || 'TBA',
            location: c.location || 'Campus',
            instructor: c.instructor || c.doctor_name || '',
          }));
          setSemesterCourses(mapped);
          persistSemesterCourses(mapped);
        }
      })
      .catch((err) => console.log('Using local courses (Backend not running or courses table empty).', err));
  };

  useEffect(() => {
    fetchCoursesFromBackend();
  }, []);

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseMessage, setCourseMessage] = useState('');
  const [gpaCourses, setGpaCourses] = useState([
    { id: 1, name: '', grade: '', creditHours: '' },
  ]);
  const [currentGpa, setCurrentGpa] = useState('');
  const [passedCreditHours, setPassedCreditHours] = useState('');
  const [gpaResult, setGpaResult] = useState(null);
  const [gpaError, setGpaError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryTab, setDirectoryTab] = useState('buildings');
  const [directoryCollege, setDirectoryCollege] = useState('All colleges');
  const [adminMessage, setAdminMessage] = useState('');
  const [adminEditor, setAdminEditor] = useState(null);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [outlookConnection, setOutlookConnection] = useState(null);
  const [outlookMessage, setOutlookMessage] = useState('');
  const [isOutlookBusy, setIsOutlookBusy] = useState(false);
  const [pendingEmailDrafts, setPendingEmailDrafts] = useState([]);
  const [emailDraftsLoaded, setEmailDraftsLoaded] = useState(false);
  const [outlookDrafts, setOutlookDrafts] = useState([]);
  const [outlookDraftsOffset, setOutlookDraftsOffset] = useState(null);
  const [isLoadingMoreOutlookDrafts, setIsLoadingMoreOutlookDrafts] = useState(false);
  const [facultyLoaded, setFacultyLoaded] = useState(false);
  const [showFoundForm, setShowFoundForm] = useState(false);
  const [editingFoundItem, setEditingFoundItem] = useState(null);

  const [liveFaculty, setLiveFaculty] = useState(facultyDirectory);

  useEffect(() => {
    fetch('http://localhost:5000/api/doctors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('The faculty API returned an invalid response.');
        setLiveFaculty(data.map(mapDoctorRecord));
        setFacultyLoaded(true);
      })
      .catch((error) => {
        console.error('Could not load faculty directory from the backend.', error);
        if (isAdmin) setAdminMessage('Could not load live faculty data. Check that the backend is running.');
      });
  }, [isAdmin]);

  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategory, setNewsCategory] = useState('All stories');
  const [newsArticles, setNewsArticles] = useState([...sampleEmailNews, ...sampleGjuNews]);
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [liveBuildings, setLiveBuildings] = useState(campusBuildings);
  const [liveBuildingsLoaded, setLiveBuildingsLoaded] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState(demoBuses[0].id);
  const selectedBus = demoBuses.find((bus) => bus.id === selectedBusId) || demoBuses[0];
  const mapUrl = `https://maps.google.com/maps?q=${selectedBus.latitude},${selectedBus.longitude}&z=15&output=embed`;

  const [categoryFilter, setCategoryFilter] = useState('All items');
  const [foundItems, setFoundItems] = useState([]);
  const [foundDate, setFoundDate] = useState(getLocalDateString);
  const foundDateInputRef = useRef(null);

  const fetchLostFoundFromBackend = useCallback(() => {
    fetch('http://localhost:5000/api/lost-found')
      .then((res) => {
        if (!res.ok) throw new Error(`Lost & Found API returned ${res.status}.`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Lost & Found API returned an invalid response.');
        setFoundItems(data.map(mapLostFoundRecord));
      })
      .catch((error) => {
        console.error('Could not load Lost & Found items.', error);
      });
  }, []);

  useEffect(() => {
    fetchLostFoundFromBackend();
    fetch('http://localhost:5000/api/buildings')
      .then((res) => {
        if (!res.ok) throw new Error(`Buildings API returned ${res.status}.`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Buildings API returned an invalid response.');
        setLiveBuildings(data.map(mapBuildingRecord));
        setLiveBuildingsLoaded(true);
      })
      .catch((error) => {
        console.error('Could not load campus buildings.', error);
      });
    fetch('http://localhost:5000/api/news')
      .then((res) => {
        if (!res.ok) throw new Error(`News API returned ${res.status}.`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('News API returned an invalid response.');
        setNewsArticles(data.map(mapNewsRecord));
        setNewsLoaded(true);
      })
      .catch((error) => {
        console.error('Could not load news stories.', error);
      });
  }, [fetchLostFoundFromBackend, isAdmin]);

  const adminRequest = useCallback(async (endpoint, method = 'GET', body) => {
    if (!isAdmin || !adminToken) {
      throw new Error('Admin access is required. Sign in again.');
    }

    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return null;

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.error || `Admin request failed (${response.status}).`);
    }
    return responseData;
  }, [adminToken, isAdmin]);

  const userRequest = useCallback(async (endpoint, method = 'GET', body) => {
    if (!userToken) throw new Error('Sign in with your student account to connect Outlook.');
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${userToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return null;
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.error || `Request failed (${response.status}).`);
    return responseData;
  }, [userToken]);

  const loadOutlookDrafts = useCallback(async (offset = 0, append = false) => {
    const result = await userRequest(`/outlook/drafts?offset=${offset}`);
    if (!Array.isArray(result.items)) throw new Error('The Outlook drafts API returned an invalid response.');
    setOutlookDrafts((current) => append ? [...current, ...result.items] : result.items);
    setOutlookDraftsOffset(result.nextOffset);
  }, [userRequest]);

  useEffect(() => {
    if (!userToken) return undefined;
    let isMounted = true;
    userRequest('/outlook/status')
      .then(async (status) => {
        if (!isMounted) return;
        setOutlookConnection(status);
        if (status.connected) {
          try {
            const result = await userRequest('/outlook/sync', 'POST');
            if (isMounted && result.imported > 0) {
              setOutlookMessage(`${result.imported} new Outlook email${result.imported === 1 ? '' : 's'} added to your private drafts.`);
            }
          } catch (error) {
            console.error('Could not sync Outlook on page open.', error);
            if (isMounted) setOutlookMessage(error.message || 'Could not check Outlook for new email.');
          }
        }
        if (isMounted) await loadOutlookDrafts();
      })
      .catch((error) => {
        console.error('Could not load Outlook connection.', error);
        if (isMounted) setOutlookMessage(error.message || 'Could not load Outlook connection status.');
      });
    return () => { isMounted = false; };
  }, [loadOutlookDrafts, userRequest, userToken]);

  useEffect(() => {
    if (!userToken || !outlookConnection?.connected) return undefined;
    const timer = window.setInterval(() => {
      loadOutlookDrafts().catch((error) => {
        console.error('Could not refresh private Outlook email drafts.', error);
      });
    }, 2 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadOutlookDrafts, outlookConnection?.connected, userToken]);

  useEffect(() => {
    if (!isAdmin || !adminToken) return;
    let isMounted = true;
    adminRequest('/admin/email-news-drafts')
      .then((drafts) => {
        if (!Array.isArray(drafts)) throw new Error('The email news drafts API returned an invalid response.');
        if (isMounted) {
          setPendingEmailDrafts(drafts);
          setEmailDraftsLoaded(true);
        }
      })
      .catch((error) => {
        console.error('Could not load pending email news drafts.', error);
        if (isMounted) setAdminMessage(error.message || 'Could not load pending email news drafts.');
      });
    return () => { isMounted = false; };
  }, [adminRequest, isAdmin, adminToken]);

  const connectOutlook = async () => {
    setIsOutlookBusy(true);
    setOutlookMessage('');
    try {
      const { authorizeUrl } = await userRequest('/outlook/connect', 'POST');
      if (typeof authorizeUrl !== 'string') throw new Error('The backend did not return a Microsoft sign-in link.');
      window.location.assign(authorizeUrl);
    } catch (error) {
      console.error('Could not connect Outlook.', error);
      setOutlookMessage(error.message || 'Could not connect Outlook.');
      setIsOutlookBusy(false);
    }
  };

  const syncOutlook = async () => {
    setIsOutlookBusy(true);
    setOutlookMessage('');
    try {
      const result = await userRequest('/outlook/sync', 'POST');
      await loadOutlookDrafts();
      setOutlookMessage(result.imported
        ? `${result.imported} new Outlook email${result.imported === 1 ? '' : 's'} added to your private drafts.`
        : 'No new Outlook emails were found.');
    } catch (error) {
      console.error('Could not check Outlook for new news emails.', error);
      setOutlookMessage(error.message || 'Could not check Outlook for new messages.');
    } finally {
      setIsOutlookBusy(false);
    }
  };

  const disconnectOutlook = async () => {
    setIsOutlookBusy(true);
    setOutlookMessage('');
    try {
      await userRequest('/outlook/connection', 'DELETE');
      setOutlookConnection((current) => ({ ...current, connected: false, email: null }));
      setOutlookMessage('Outlook disconnected. Your imported email drafts remain in your account. Revoke UniMate access in Microsoft settings to remove its Mail.Read permission.');
    } catch (error) {
      console.error('Could not disconnect Outlook.', error);
      setOutlookMessage(error.message || 'Could not disconnect Outlook.');
    } finally {
      setIsOutlookBusy(false);
    }
  };

  const loadMoreOutlookDrafts = async () => {
    if (outlookDraftsOffset == null || isLoadingMoreOutlookDrafts) return;
    setIsLoadingMoreOutlookDrafts(true);
    try {
      await loadOutlookDrafts(outlookDraftsOffset, true);
    } catch (error) {
      console.error('Could not load older Outlook emails.', error);
      setOutlookMessage(error.message || 'Could not load older Outlook emails.');
    } finally {
      setIsLoadingMoreOutlookDrafts(false);
    }
  };

  const submitOutlookDraft = async (draft) => {
    try {
      await userRequest(`/outlook/drafts/${draft.id}/submit`, 'POST');
      setOutlookDrafts((current) => current.map((item) => (
        item.id === draft.id ? { ...item, status: 'pending' } : item
      )));
      setOutlookMessage('Email submitted to the admin news review queue.');
    } catch (error) {
      console.error('Could not submit an Outlook email for review.', error);
      setOutlookMessage(error.message || 'Could not submit this email for review.');
    }
  };

  const deleteOutlookDraft = async (draft) => {
    try {
      await userRequest(`/outlook/drafts/${draft.id}`, 'DELETE');
      setOutlookDrafts((current) => current.filter((item) => item.id !== draft.id));
      setOutlookMessage('Private email draft deleted.');
    } catch (error) {
      console.error('Could not delete an Outlook email draft.', error);
      setOutlookMessage(error.message || 'Could not delete this email draft.');
    }
  };

  const publishEmailDraft = async (draft) => {
    try {
      const article = await adminRequest(`/admin/email-news-drafts/${draft.id}/publish`, 'POST');
      setPendingEmailDrafts((current) => current.filter((item) => item.id !== draft.id));
      const savedArticle = mapNewsRecord(article);
      setNewsArticles((current) => [savedArticle, ...current.filter((item) => item.id !== savedArticle.id)]);
      setAdminMessage('Email news draft reviewed and published.');
    } catch (error) {
      console.error('Could not publish email news draft.', error);
      setAdminMessage(error.message || 'Could not publish email news draft.');
    }
  };

  const rejectEmailDraft = async (draft) => {
    try {
      await adminRequest(`/admin/email-news-drafts/${draft.id}`, 'DELETE');
      setPendingEmailDrafts((current) => current.filter((item) => item.id !== draft.id));
      setAdminMessage('Email news draft rejected.');
    } catch (error) {
      console.error('Could not reject email news draft.', error);
      setAdminMessage(error.message || 'Could not reject email news draft.');
    }
  };

  const openAdminEditor = (entity, record = null) => {
    setAdminMessage('');
    setAdminEditor({ entity, record });
  };

  const closeAdminEditor = () => setAdminEditor(null);

  const handleAdminSave = async (event) => {
    event.preventDefault();
    if (!adminEditor) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const { entity, record } = adminEditor;
    const endpoint = entity === 'faculty'
      ? `/doctors${record ? `/${record.id}` : ''}`
      : entity === 'building'
        ? `/buildings${record ? `/${record.id}` : ''}`
        : `/news${record ? `/${record.id}` : ''}`;

    setIsAdminSaving(true);
    setAdminMessage('');
    try {
      const saved = await adminRequest(endpoint, record ? 'PUT' : 'POST', values);
      if (entity === 'faculty') {
        const updated = mapDoctorRecord(saved);
        setLiveFaculty((current) => record
          ? current.map((item) => (String(item.id) === String(updated.id) ? updated : item))
          : [...current, updated]);
        setFacultyLoaded(true);
      } else if (entity === 'building') {
        const updated = mapBuildingRecord(saved);
        setLiveBuildings((current) => record
          ? current.map((item) => (String(item.id) === String(updated.id) ? updated : item))
          : [...current, updated]);
        setLiveBuildingsLoaded(true);
      } else {
        const updated = mapNewsRecord(saved);
        setNewsArticles((current) => record
          ? current.map((item) => (String(item.id) === String(updated.id) ? updated : item))
          : [...current, updated]);
        setNewsLoaded(true);
      }
      setAdminEditor(null);
      setAdminMessage(`${entity === 'faculty' ? 'Faculty member' : entity === 'building' ? 'Building' : 'News story'} ${record ? 'updated' : 'added'} successfully.`);
    } catch (error) {
      console.error(`Could not save ${entity} record.`, error);
      setAdminMessage(error.message || `Could not save ${entity} record.`);
    } finally {
      setIsAdminSaving(false);
    }
  };

  const deleteAdminRecord = async (entity, record) => {
    const description = entity === 'faculty' ? record.name : record.title || record.name;
    if (!window.confirm(`Delete "${description}"? This cannot be undone.`)) return;
    const endpoint = entity === 'faculty'
      ? `/doctors/${record.id}`
      : entity === 'building'
        ? `/buildings/${record.id}`
        : `/news/${record.id}`;
    setAdminMessage('');
    try {
      await adminRequest(endpoint, 'DELETE');
      if (entity === 'faculty') {
        setLiveFaculty((current) => current.filter((item) => String(item.id) !== String(record.id)));
      } else if (entity === 'building') {
        setLiveBuildings((current) => current.filter((item) => String(item.id) !== String(record.id)));
      } else {
        setNewsArticles((current) => current.filter((item) => String(item.id) !== String(record.id)));
      }
      setAdminMessage('Deleted successfully.');
    } catch (error) {
      console.error(`Could not delete ${entity} record.`, error);
      setAdminMessage(error.message || `Could not delete ${entity} record.`);
    }
  };

  const [postMessage, setPostMessage] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const persistSemesterCourses = (courses) => {
    try {
      window.localStorage.setItem('unimate.semesterCourses.v1', JSON.stringify(courses));
      return true;
    } catch (error) {
      console.error('Could not save semester courses.', error);
      setCourseMessage('Your courses could not be saved on this device. Check browser storage settings.');
      return false;
    }
  };

  const saveSemesterCourse = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const course = {
      id: editingCourseId || `course-${Date.now()}`,
      name: String(formData.get('name')).trim(),
      credits: Number(formData.get('credits')),
      schedule: String(formData.get('schedule')).trim(),
      location: String(formData.get('location')).trim(),
      instructor: String(formData.get('instructor')).trim(),
    };

    const duplicate = semesterCourses.some(
      (existingCourse) => existingCourse.name.toLowerCase() === course.name.toLowerCase()
        && existingCourse.id !== editingCourseId,
    );
    if (duplicate) {
      setCourseMessage('A course with this name is already in your semester list.');
      return;
    }

    try {
      await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });
    } catch {
      // continues and stores locally
    }

    const updatedCourses = editingCourseId
      ? semesterCourses.map((existingCourse) => (existingCourse.id === editingCourseId ? course : existingCourse))
      : [...semesterCourses, course];
    if (!persistSemesterCourses(updatedCourses)) return;
    setSemesterCourses(updatedCourses);
    setCourseMessage(editingCourseId ? 'Course details updated.' : 'Course added to your semester.');
    setShowCourseForm(false);
    setEditingCourseId(null);
    event.currentTarget.reset();
  };

  const editSemesterCourse = (course) => {
    setEditingCourseId(course.id);
    setShowCourseForm(true);
    setCourseMessage('');
  };

  const removeSemesterCourse = (course) => {
    const updatedCourses = semesterCourses.filter((item) => item.id !== course.id);
    if (!persistSemesterCourses(updatedCourses)) return;
    setSemesterCourses(updatedCourses);
    setCourseMessage(`${course.name} removed from your semester.`);
  };

  const handleImageChange = (event) => {
    const image = event.target.files?.[0];
    setPostMessage('');
    if (!image) {
      setImagePreview('');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) {
      event.target.value = '';
      setImagePreview('');
      setPostMessage('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      event.target.value = '';
      setImagePreview('');
      setPostMessage('The image must be 5 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      } else {
        setPostMessage('The image could not be previewed. Please choose another image.');
      }
    };
    reader.onerror = () => {
      setPostMessage('The image could not be read. Please choose another image.');
    };
    reader.readAsDataURL(image);
  };

  const filteredItems = foundItems.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [
      item.title,
      item.category,
      item.location,
      item.description,
    ].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (categoryFilter === 'All items' || item.category === categoryFilter);
  }).sort((a, b) => getDateTimestamp(b.date) - getDateTimestamp(a.date));

  const normalizedDirectorySearch = directorySearch.trim().toLowerCase();
  const currentFacultyList = facultyLoaded ? liveFaculty : facultyDirectory;
  const currentBuildingList = liveBuildingsLoaded ? liveBuildings : campusBuildings;
  const directoryColleges = [...new Map([
    ...currentBuildingList.map((building) => building.college),
    ...currentFacultyList.map((faculty) => faculty.college),
  ].map(normalizeCollegeName)
    .filter(Boolean)
    .map((college) => [college.toLocaleLowerCase(), college]))]
    .map(([, college]) => college)
    .sort((a, b) => a.localeCompare(b));
  const filteredBuildings = currentBuildingList.filter((building) => {
    const matchesSearch = !normalizedDirectorySearch || [
      building.name,
      building.code,
      building.college,
      building.location,
      building.details,
    ].some((value) => value.toLowerCase().includes(normalizedDirectorySearch));
    return matchesSearch && (
      directoryCollege === 'All colleges'
      || normalizeCollegeName(building.college) === directoryCollege
    );
  });

  const filteredFaculty = currentFacultyList.filter((faculty) => {
    const matchesSearch = !normalizedDirectorySearch || [
      faculty.name,
      faculty.title,
      faculty.college,
      faculty.department,
      faculty.office,
    ].some((value) => value.toLowerCase().includes(normalizedDirectorySearch));
    return matchesSearch && (
      directoryCollege === 'All colleges'
      || normalizeCollegeName(faculty.college) === directoryCollege
    );
  });

  const filteredNews = newsArticles.filter((article) => {
    const query = newsSearch.trim().toLowerCase();
    const matchesSearch = !query || [
      article.title,
      article.category,
      article.summary,
    ].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (newsCategory === 'All stories' || article.category === newsCategory);
  }).sort((a, b) => getDateTimestamp(b.date) - getDateTimestamp(a.date));
  const newsCategories = [...new Set(newsArticles.map((article) => article.category))].sort((a, b) => a.localeCompare(b));
  const featuredNews = filteredNews[0];
  const latestNews = filteredNews.slice(1);

  const addFoundItem = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageFile = formData.get('image');
    if (imageFile instanceof File && imageFile.size > 0 && !imagePreview) {
      setPostMessage('Wait for the image preview to finish, or remove the image before publishing.');
      return;
    }

    const email = formData.get('email')?.trim() || '';
    const phone = formData.get('phone')?.trim() || '';
    const contactCombined = [email, phone].filter(Boolean).join(' | ');

    const payload = {
      title: formData.get('title')?.trim(),
      category: formData.get('category'),
      location: formData.get('location')?.trim(),
      date_lost_found: formData.get('date'),
      description: formData.get('description')?.trim(),
      contact_info: contactCombined,
    };

    try {
      const response = editingFoundItem
        ? await adminRequest(`/lost-found/${editingFoundItem.id}`, 'PUT', payload)
        : await fetch('http://localhost:5000/api/lost-found', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, image_path: imagePreview || '' }),
        });

      if (response.ok === false) {
        const data = await response.json();
        throw new Error(data.error || 'Could not save this listing.');
      }

      if (!editingFoundItem) {
        const data = await response.json();
        setPostMessage('Item added successfully.');
        if (data.id) {
          fetchLostFoundFromBackend();
        }
      } else {
        const updatedItem = mapLostFoundRecord(response);
        setFoundItems((current) => current.map((item) => (
          String(item.id) === String(updatedItem.id) ? updatedItem : item
        )));
        setPostMessage('Listing updated successfully.');
      }
    } catch (error) {
      console.error('Could not save Lost & Found listing.', error);
      if (editingFoundItem || !(error instanceof TypeError)) {
        setPostMessage(error.message || 'Could not save this listing.');
        return;
      }

      const localItem = {
        id: Date.now(),
        title: payload.title,
        category: payload.category,
        location: payload.location,
        date: payload.date_lost_found,
        description: payload.description,
        email,
        phone,
        image: imagePreview,
      };
      setFoundItems((currentItems) => [localItem, ...currentItems]);
      setPostMessage('Item added locally. The backend could not be reached.');
    }

    setSearchTerm('');
    setCategoryFilter('All items');
    setImagePreview('');
    setEditingFoundItem(null);
    setShowFoundForm(false);
    form.reset();
  };

  const startFoundItemEdit = (item) => {
    if (!isAdmin) return;
    setEditingFoundItem(item);
    setFoundDate(item.date === 'Recently' ? getLocalDateString() : item.date);
    setImagePreview(item.image || '');
    setShowFoundForm(true);
    setPostMessage('');
  };

  const deleteFoundItem = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setPostMessage('');
    try {
      await adminRequest(`/lost-found/${item.id}`, 'DELETE');
      setFoundItems((current) => current.filter((entry) => String(entry.id) !== String(item.id)));
      setPostMessage('Listing deleted successfully.');
    } catch (error) {
      console.error('Could not delete Lost & Found listing.', error);
      setPostMessage(error.message || 'Could not delete this listing.');
    }
  };

  const closeFoundItemForm = () => {
    setShowFoundForm(false);
    setEditingFoundItem(null);
    setImagePreview('');
    setPostMessage('');
  };

  const updateGpaCourse = (id, field, value) => {
    setGpaCourses((courses) => courses.map((course) => (
      course.id === id ? { ...course, [field]: value } : course
    )));
    setGpaResult(null);
    setGpaError('');
  };

  const addGpaCourse = () => {
    setGpaCourses((courses) => [
      ...courses,
      { id: Date.now(), name: '', grade: '', creditHours: '' },
    ]);
    setGpaResult(null);
    setGpaError('');
  };

  const removeGpaCourse = (id) => {
    setGpaCourses((courses) => courses.filter((course) => course.id !== id));
    setGpaResult(null);
    setGpaError('');
  };

  const calculateGpa = (event) => {
    event.preventDefault();
    const normalizedCourseNames = gpaCourses.map((course) => course.name.trim().replace(/\s+/g, ' ').toLowerCase());
    const hasDuplicateCourses = new Set(normalizedCourseNames).size !== normalizedCourseNames.length;

    if (
      currentGpa === ''
      || !Number.isFinite(Number(currentGpa))
      || Number(currentGpa) < 0
      || Number(currentGpa) > 100
      || passedCreditHours === ''
      || !Number.isFinite(Number(passedCreditHours))
      || Number(passedCreditHours) < 0
      || gpaCourses.some((course) => (
        !course.name.trim()
        || course.grade === ''
        || course.creditHours === ''
        || !Number.isFinite(Number(course.grade))
        || Number(course.grade) < 0
        || Number(course.grade) > 100
        || !Number.isFinite(Number(course.creditHours))
        || Number(course.creditHours) <= 0
      ))
    ) {
      setGpaError('Enter your current GPA (0–100), passed credit hours, and valid details for every new course.');
      setGpaResult(null);
      return;
    }

    if (hasDuplicateCourses) {
      setGpaError('Each course can only be entered once. Remove or rename the duplicate course.');
      setGpaResult(null);
      return;
    }

    const newCreditHours = gpaCourses.reduce((sum, course) => sum + Number(course.creditHours), 0);
    const totalCredits = Number(passedCreditHours) + newCreditHours;
    const totalWeightedGrade = gpaCourses.reduce(
      (sum, course) => sum + Number(course.grade) * Number(course.creditHours),
      Number(currentGpa) * Number(passedCreditHours),
    );
    const average = totalWeightedGrade / totalCredits;
    const classification = average < 60
      ? 'Below acceptable'
      : average < 68
        ? 'Acceptable'
        : average < 76
          ? 'Good'
          : average < 84
            ? 'Very Good'
            : 'Excellent';
    setGpaResult({
      average,
      classification,
      totalCredits,
      newCreditHours,
      passedCreditHours: Number(passedCreditHours),
    });
    setGpaError('');
  };

  return (
    <main className="dashboard-page" dir="ltr">
      {isSidebarOpen && (
        <button
          className="dashboard-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`dashboard-sidebar${isSidebarOpen ? ' is-open' : ''}`}>
        <a className="dashboard-brand" href="#overview" aria-label="UniMate home">
          <span className="dashboard-logo">
            <img src={universityLogo} alt="" />
          </span>
          <span>UniMate</span>
        </a>

        <p className="sidebar-label">STUDENT SPACE</p>
        <nav className="dashboard-nav" aria-label="Main navigation">
          <button
            className={`nav-link${activeSection === 'overview' ? ' selected' : ''}`}
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setActiveSection('overview');
              setPostMessage('');
            }}
          >
            <span aria-hidden="true">⌂</span>Overview
          </button>
          <button
            className={`nav-link${activeSection === 'lost-found' ? ' selected' : ''}`}
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setActiveSection('lost-found');
              setPostMessage('');
            }}
          >
            <span aria-hidden="true">⌕</span>Lost &amp; Found
          </button>
          <button
            className={`nav-link${activeSection === 'directory' ? ' selected' : ''}`}
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setActiveSection('directory');
              setPostMessage('');
            }}
          >
            <span aria-hidden="true">▦</span>Buildings &amp; Faculty
          </button>
          <button
            className={`nav-link${activeSection === 'gpa' ? ' selected' : ''}`}
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setActiveSection('gpa');
              setGpaError('');
            }}
          >
            <span aria-hidden="true">％</span>GPA calculator
          </button>
          <button
            className={`nav-link${activeSection === 'bus-tracker' ? ' selected' : ''}`}
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setActiveSection('bus-tracker');
              setGpaError('');
            }}
          >
            <span aria-hidden="true">▣</span>Bus tracker
          </button>
          <button
            className={`nav-link${activeSection === 'news' ? ' selected' : ''}`}
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setActiveSection('news');
            }}
          >
            <span aria-hidden="true">▤</span>GJU News
          </button>
          {/* تبويب الإيميل الجديد بجانب قسم الأخبار */}
          <button
            className={`nav-link${activeSection === 'emails' ? ' selected' : ''}`}
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setActiveSection('emails');
            }}
          >
            <span aria-hidden="true">✉</span>Inbox / Emails
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="signout-button" type="button" onClick={onSignOut}>
            <span aria-hidden="true">↪</span> Sign out
          </button>
        </div>
      </aside>

      <section className="dashboard-main" id="overview">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-heading">
            <button
              className="dashboard-menu-toggle"
              type="button"
              aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((open) => !open)}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div>
            <span className="dashboard-kicker">GERMAN JORDANIAN UNIVERSITY</span>
            <p className="dashboard-breadcrumb">
              Student space <span>/</span> {
                activeSection === 'lost-found'
                  ? 'Lost & Found'
                  : activeSection === 'directory'
                    ? 'Buildings & Faculty'
                    : activeSection === 'gpa'
                      ? 'GPA calculator'
                      : activeSection === 'bus-tracker'
                        ? 'Bus tracker'
                        : activeSection === 'news'
                          ? 'GJU News'
                          : activeSection === 'emails'
                            ? 'Student Inbox'
                            : 'Overview'
              }
            </p>
            </div>
          </div>
          <div className="student-profile">
            <div className="profile-copy">
              <strong>{studentName}</strong>
              <span>{isAdmin ? 'Administrator' : 'GJU Student'}</span>
            </div>
            <span className="profile-avatar" aria-hidden="true">{studentName.charAt(0).toUpperCase()}</span>
          </div>
        </header>
        {authMessage && <p className="auth-dashboard-message" role="alert">{authMessage}</p>}
        {isAdmin && (
          <div className="admin-mode-banner">
            <strong>Administrator mode</strong>
            <span>Changes you make here update the shared database.</span>
          </div>
        )}
        {adminMessage && <p className="admin-message" role="status">{adminMessage}</p>}
        {isPreviewSession && (
          <p className="auth-preview-dashboard-notice" role="note">
            Preview mode: you are not signed in to a real account. Your access will end when you sign out or reload the page.
          </p>
        )}

        {activeSection === 'overview' ? (
          <div className="dashboard-content">
            <section className="dashboard-hero">
              <div className="hero-copy">
                <span className="hero-eyebrow">YOUR SEMESTER, IN SYNC</span>
                <h1>Welcome back, {studentName}<span className="hero-period">.</span></h1>
                <p>Your study space is ready. Here’s what’s happening with your university life.</p>
                <a className="hero-action" href="#schedule">View today’s schedule <span aria-hidden="true">→</span></a>
              </div>
              <div className="hero-art" aria-hidden="true">
                <span className="hero-sun" />
                <span className="hero-book book-back" />
                <span className="hero-book book-front"><i /><i /><i /></span>
                <span className="hero-star">✳</span>
              </div>
            </section>

            <section className="overview-grid" aria-label="Semester overview">
              <article className="overview-card">
                <span className="overview-icon blue-icon" aria-hidden="true">▤</span>
                <div><span className="overview-label">Enrolled courses</span><strong>{semesterCourses.length} <small>this semester</small></strong></div>
                <span className="card-arrow" aria-hidden="true">↗</span>
              </article>
              <article className="overview-card">
                <span className="overview-icon gold-icon" aria-hidden="true">◷</span>
                <div><span className="overview-label">Total credit hours</span><strong>{semesterCourses.reduce((total, course) => total + course.credits, 0)} <small>this semester</small></strong></div>
                <span className="card-arrow" aria-hidden="true">↗</span>
              </article>
            </section>

            <div className="dashboard-lower-grid">
              <section className="dashboard-card schedule-card" id="schedule">
                <div className="section-heading">
                  <div><span className="section-kicker">YOUR SEMESTER</span><h2>Class schedule</h2></div>
                  <button className="schedule-add-button" type="button" onClick={() => {
                    setEditingCourseId(null);
                    setShowCourseForm(true);
                    setCourseMessage('');
                  }}>＋ Add course</button>
                </div>
                <div className="lecture-list">
                  {semesterCourses.length ? semesterCourses.map((course, index) => (
                    <article className="lecture-row" key={course.id}>
                      <span className="lecture-time course-hours">{course.credits}<small>credits</small></span>
                      <span className={`lecture-marker ${['blue-marker', 'gold-marker', 'green-marker'][index % 3]}`} />
                      <div>
                        <strong>{course.name}</strong>
                        <span>{course.schedule} · {course.location}</span>
                      </div>
                    </article>
                  )) : (
                    <p className="course-empty-message">Add your courses to see your class times and locations here.</p>
                  )}
                </div>
              </section>
            </div>

            <section className="courses-section" id="courses">
              <div className="section-heading">
                <div><span className="section-kicker">YOUR SEMESTER</span><h2>Your courses</h2></div>
                <button
                  className="schedule-add-button"
                  type="button"
                  onClick={() => {
                    setEditingCourseId(null);
                    setShowCourseForm(true);
                    setCourseMessage('');
                  }}
                >
                  ＋ Add course
                </button>
              </div>
              {courseMessage && <p className="course-form-message" role="status">{courseMessage}</p>}
              {showCourseForm && (
                <form className="semester-course-form" onSubmit={saveSemesterCourse}>
                  <h3>{editingCourseId ? 'Edit course' : 'Add a course'}</h3>
                  <div className="semester-course-fields">
                    <label>
                      <span>Course name</span>
                      <input name="name" required maxLength={80} placeholder="e.g. Computer Networks" defaultValue={semesterCourses.find((course) => course.id === editingCourseId)?.name || ''} />
                    </label>
                    <label>
                      <span>Credit hours</span>
                      <input name="credits" type="number" min="0.5" max="30" step="0.5" required placeholder="3" defaultValue={semesterCourses.find((course) => course.id === editingCourseId)?.credits || ''} />
                    </label>
                    <label>
                      <span>Class days and hours</span>
                      <input name="schedule" required maxLength={100} placeholder="e.g. Mon & Wed, 10:00–11:30 AM" defaultValue={semesterCourses.find((course) => course.id === editingCourseId)?.schedule || ''} />
                    </label>
                    <label>
                      <span>Where is the class?</span>
                      <input name="location" required maxLength={100} placeholder="e.g. Building B, Room 204" defaultValue={semesterCourses.find((course) => course.id === editingCourseId)?.location || ''} />
                    </label>
                    <label>
                      <span>Instructor <small>(optional)</small></span>
                      <input name="instructor" maxLength={80} placeholder="Instructor name" defaultValue={semesterCourses.find((course) => course.id === editingCourseId)?.instructor || ''} />
                    </label>
                  </div>
                  <div className="semester-course-form-actions">
                    <button className="post-item-button" type="submit">{editingCourseId ? 'Save changes' : 'Add course'}</button>
                    <button className="course-cancel-button" type="button" onClick={() => {
                      setShowCourseForm(false);
                      setEditingCourseId(null);
                      setCourseMessage('');
                    }}>Cancel</button>
                  </div>
                </form>
              )}
              {semesterCourses.length ? (
                <div className="course-grid">
                  {semesterCourses.map((course, index) => (
                    <article className={`course-card ${['course-blue', 'course-gold', 'course-green'][index % 3]}`} key={course.id}>
                      <span className="course-symbol" aria-hidden="true">{['⌘', '⌁', '∑'][index % 3]}</span>
                      <span className="course-code">{course.credits} credit hours</span>
                      <h3>{course.name}</h3>
                      <p>{course.schedule}</p>
                      <p className="semester-course-location">{course.location}</p>
                      {course.instructor && <p>{course.instructor}</p>}
                      <div className="course-card-actions">
                        <button type="button" onClick={() => editSemesterCourse(course)}>Edit</button>
                        <button type="button" onClick={() => removeSemesterCourse(course)}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="courses-empty-state">No courses added yet. Add your semester courses, credit hours, class times, and locations to personalize your overview.</div>
              )}
            </section>
            <p className="demo-notice">
              {isPreviewSession
                ? 'Preview account only. Sign in to Supabase to verify and save your account.'
                : 'Your account is verified with Supabase. Student dashboard data is still a local preview.'}
            </p>
          </div>
        ) : activeSection === 'lost-found' ? (
          <div className="dashboard-content lost-found-content" id="lost-and-found">
            <section className="lost-found-hero">
              <div>
                <span className="section-kicker">LOOKING FOR SOMETHING?</span>
                <h1>Lost &amp; Found</h1>
                <p>Search items found around campus, or help someone by posting an item you found.</p>
              </div>
              <span className="lost-found-hero-icon" aria-hidden="true">⌕</span>
            </section>

            <section className="lost-found-tools" aria-label="Search found items">
              <label className="lost-search">
                <span className="search-icon" aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by item, details, or campus location"
                  aria-label="Search found items"
                />
              </label>
              <label className="category-filter">
                <span className="visually-hidden">Filter by category</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option>All items</option>
                  <option>Personal items</option>
                  <option>Books &amp; stationery</option>
                  <option>Electronics</option>
                  <option>Other</option>
                </select>
              </label>
              <button
                className="post-item-button"
                type="button"
                onClick={() => {
                  if (showFoundForm) {
                    closeFoundItemForm();
                  } else {
                    setFoundDate(getLocalDateString());
                    setShowFoundForm(true);
                  }
                  setPostMessage('');
                }}
              >
                <span aria-hidden="true">＋</span> Post a found item
              </button>
            </section>

            {postMessage && <p className="post-success" role="status">{postMessage}</p>}

            {showFoundForm && (
              <section className="dashboard-card found-form-card" aria-labelledby="found-form-title">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">HELP REUNITE IT WITH ITS OWNER</span>
                    <h2 id="found-form-title">{editingFoundItem ? 'Edit found item' : 'Post a found item'}</h2>
                  </div>
                  <button className="close-form-button" type="button" onClick={closeFoundItemForm} aria-label="Close form">×</button>
                </div>
                <form className="found-item-form" onSubmit={addFoundItem}>
                  <label>
                    <span>Item name</span>
                    <input name="title" placeholder="e.g. Blue water bottle" required maxLength={80} defaultValue={editingFoundItem?.title || ''} />
                  </label>
                  <label>
                    <span>Category</span>
                    <select name="category" defaultValue={editingFoundItem?.category || 'Personal items'} required>
                      <option>Personal items</option>
                      <option>Books &amp; stationery</option>
                      <option>Electronics</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label>
                    <span>Where did you find it?</span>
                    <input name="location" placeholder="Building or campus location" required maxLength={100} defaultValue={editingFoundItem?.location || ''} />
                  </label>
                  <label>
                    <span>Date found</span>
                    <div className="found-date-control">
                      <input
                        ref={foundDateInputRef}
                        name="date"
                        type="date"
                        value={foundDate}
                        onChange={(event) => setFoundDate(event.target.value)}
                        required
                      />
                      <button
                        className="found-date-picker-button"
                        type="button"
                        aria-label="Choose found date"
                        onClick={() => {
                          const dateInput = foundDateInputRef.current;
                          if (!dateInput) return;
                          if (typeof dateInput.showPicker === 'function') {
                            dateInput.showPicker();
                          } else {
                            dateInput.click();
                          }
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                          <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h2m4 0h2M8 16.5h2" />
                        </svg>
                      </button>
                    </div>
                  </label>
                  <label className="found-description">
                    <span>Description</span>
                    <textarea name="description" placeholder="Add details that could help the owner identify it" rows="3" required maxLength={400} defaultValue={editingFoundItem?.description || ''} />
                  </label>
                  <label className="found-email">
                    <span>Contact email</span>
                    <input name="email" type="email" placeholder="you@gju.edu.jo" required maxLength={120} defaultValue={editingFoundItem?.email || ''} />
                  </label>
                  <label>
                    <span>Contact phone number <small>(optional)</small></span>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="10-digit number"
                      autoComplete="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      minLength={10}
                      maxLength={10}
                      title="Enter exactly 10 digits, or leave this field empty."
                      defaultValue={editingFoundItem?.phone || ''}
                    />
                  </label>
                  <label className="found-image-field">
                    <span>Item photo <small>(optional)</small></span>
                    <input
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                    />
                  </label>
                  {imagePreview && (
                    <div className="found-image-preview">
                      <img src={imagePreview} alt="Preview of the found item" />
                      <span>Image preview</span>
                    </div>
                  )}

                  {!editingFoundItem && (
                    <p className="found-safety-note">
                      Your email and phone number will be visible to students viewing this listing. Avoid posting personal details that could identify the owner.
                    </p>
                  )}
                  <button className="post-item-button found-submit" type="submit">
                    {editingFoundItem ? 'Save listing' : 'Publish listing'} <span aria-hidden="true">→</span>
                  </button>
                </form>
              </section>
            )}

            <section className="found-listings" aria-labelledby="found-listings-title">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">RECENTLY REPORTED</span>
                  <h2 id="found-listings-title">Found on campus <span className="listing-count">{filteredItems.length}</span></h2>
                </div>
              </div>
              {filteredItems.length ? (
                <div className="found-item-grid">
                  {filteredItems.map((item) => (
                    <article className="found-item-card" key={item.id}>
                      {item.image ? (
                        <img className="found-item-photo" src={item.image} alt={item.title} />
                      ) : (
                        <div className="found-item-photo-placeholder" aria-hidden="true">⌕</div>
                      )}
                      <div className="found-item-card-top">
                        <span className="found-category">{item.category}</span>
                      </div>
                      {isAdmin && (
                        <div className="admin-card-actions">
                          <button type="button" onClick={() => startFoundItemEdit(item)}>Edit</button>
                          <button className="admin-delete-button" type="button" onClick={() => deleteFoundItem(item)}>Delete</button>
                        </div>
                      )}
                      <h3>{item.title}</h3>
                      <p className="found-description-text">{item.description}</p>
                      <div className="found-item-meta">
                        <span><strong>Found at</strong>{item.location}</span>
                        <span><strong>Date</strong>{formatFoundDate(item.date)}</span>
                      </div>
                      <div className="finder-contacts">
                        {item.phone && (
                          <a className="contact-finder" href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>
                            <span aria-hidden="true">☎</span> {item.phone}
                          </a>
                        )}
                        {item.email && (
                          <a className="contact-finder" href={`mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Lost item: ${item.title}`)}`}>
                            <span aria-hidden="true">✉</span> {item.email}
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-listings">
                  <span aria-hidden="true">⌕</span>
                  <h3>No matching items found</h3>
                  <p>Try a different search or category.</p>
                </div>
              )}
            </section>
            <p className="demo-notice">Listings in this preview are stored and synchronized with your MySQL database.</p>
          </div>
        ) : activeSection === 'directory' ? (
          <div className="dashboard-content directory-content">
            <section className="directory-hero">
              <div>
                <span className="section-kicker">CAMPUS DIRECTORY</span>
                <h1>Buildings &amp; Faculty</h1>
                <p>Find your way around campus and look up faculty by college or department.</p>
              </div>
              <span className="directory-hero-icon" aria-hidden="true">▦</span>
            </section>

            <p className="directory-demo-note">
              Sample directory for layout preview only. Names, locations, and contact details are synchronized with the database when available.
            </p>

            <section className="directory-controls" aria-label="Search the campus directory">
              <div className="directory-tabs" role="tablist" aria-label="Directory type">
                <button
                  className={`directory-tab${directoryTab === 'buildings' ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={directoryTab === 'buildings'}
                  onClick={() => setDirectoryTab('buildings')}
                >
                  <span aria-hidden="true">▦</span> Buildings
                </button>
                <button
                  className={`directory-tab${directoryTab === 'faculty' ? ' active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={directoryTab === 'faculty'}
                  onClick={() => setDirectoryTab('faculty')}
                >
                  <span aria-hidden="true">♙</span> Faculty
                </button>
              </div>

              <label className="directory-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={directorySearch}
                  onChange={(event) => setDirectorySearch(event.target.value)}
                  placeholder={directoryTab === 'buildings' ? 'Search buildings, colleges, or locations' : 'Search faculty, department, or office'}
                  aria-label={directoryTab === 'buildings' ? 'Search buildings' : 'Search faculty'}
                />
              </label>

              <label className="directory-college-filter">
                <span className="visually-hidden">Filter by college</span>
                <select value={directoryCollege} onChange={(event) => setDirectoryCollege(event.target.value)}>
                  <option>All colleges</option>
                  {directoryColleges.map((college) => <option key={college}>{college}</option>)}
                </select>
              </label>
            </section>

            {directoryTab === 'buildings' ? (
              <section className="directory-results" aria-label="Campus buildings">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">EXPLORE THE CAMPUS</span>
                    <h2>Campus buildings <span className="listing-count">{filteredBuildings.length}</span></h2>
                  </div>
                  {isAdmin && (
                    <button className="post-item-button" type="button" onClick={() => openAdminEditor('building')}>
                      ＋ Add building
                    </button>
                  )}
                </div>
                {isAdmin && adminEditor?.entity === 'building' && (
                  <AdminEditor
                    title={adminEditor.record ? 'Edit building' : 'Add building'}
                    fields={adminFields.building}
                    initialValues={adminEditor.record || {}}
                    onSave={handleAdminSave}
                    onCancel={closeAdminEditor}
                    saving={isAdminSaving}
                  />
                )}
                {filteredBuildings.length ? (
                  <div className="directory-card-grid">
                    {filteredBuildings.map((building, index) => (
                      <article className="directory-card building-card" key={building.id || building.code}>
                        <div className={`directory-card-art building-art building-art-${index % 3}`}>
                          <span className="building-art-symbol" aria-hidden="true">▦</span>
                          <span className="building-code">{building.code}</span>
                        </div>
                        <div className="directory-card-body">
                          <span className="directory-tag">{building.college}</span>
                          <h3>{building.name}</h3>
                          <p className="directory-detail">{building.details}</p>
                          <div className="directory-meta-row">
                            <span><strong>Location</strong>{building.location}</span>
                            <span><strong>Building</strong>{building.floors}</span>
                          </div>
                          {isAdmin && (
                            <div className="admin-card-actions">
                              <button type="button" onClick={() => openAdminEditor('building', building)}>Edit</button>
                              <button className="admin-delete-button" type="button" onClick={() => deleteAdminRecord('building', building)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-listings">
                    <span aria-hidden="true">▦</span>
                    <h3>No matching buildings</h3>
                    <p>Try another name, location, or college filter.</p>
                  </div>
                )}
              </section>
            ) : (
              <section className="directory-results" aria-label="Faculty directory">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">COLLEGE CONTACTS</span>
                    <h2>Faculty directory <span className="listing-count">{filteredFaculty.length}</span></h2>
                  </div>
                  {isAdmin && (
                    <button className="post-item-button" type="button" onClick={() => openAdminEditor('faculty')}>
                      ＋ Add faculty
                    </button>
                  )}
                </div>
                {isAdmin && adminEditor?.entity === 'faculty' && (
                  <AdminEditor
                    title={adminEditor.record ? 'Edit faculty member' : 'Add faculty member'}
                    fields={adminFields.faculty}
                    initialValues={adminEditor.record ? {
                      full_name: adminEditor.record.name,
                      position: adminEditor.record.title,
                      department: adminEditor.record.department,
                      email: adminEditor.record.email,
                      office_room: adminEditor.record.office,
                      office_hours: adminEditor.record.officeHours,
                    } : {}}
                    onSave={handleAdminSave}
                    onCancel={closeAdminEditor}
                    saving={isAdminSaving}
                  />
                )}
                {filteredFaculty.length ? (
                  <div className="directory-card-grid faculty-grid">
                    {filteredFaculty.map((faculty) => (
                      <article className="directory-card faculty-card" key={faculty.id || faculty.email}>
                        <div className="faculty-avatar" aria-hidden="true">{faculty.name.charAt(0) || 'D'}</div>
                        <div className="directory-card-body">
                          <span className="directory-tag">{faculty.college}</span>
                          <h3>{faculty.name}</h3>
                          <p className="faculty-title">{faculty.title} · {faculty.department}</p>
                          <div className="directory-meta-row faculty-meta">
                            <span><strong>Office</strong>{faculty.office}</span>
                          </div>
                          <a className="faculty-email" href={`mailto:${faculty.email}`}>
                            <span aria-hidden="true">✉</span>{faculty.email}
                          </a>
                          {isAdmin && (
                            <div className="admin-card-actions">
                              <button type="button" onClick={() => openAdminEditor('faculty', faculty)}>Edit</button>
                              <button className="admin-delete-button" type="button" onClick={() => deleteAdminRecord('faculty', faculty)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-listings">
                    <span aria-hidden="true">♙</span>
                    <h3>No matching faculty</h3>
                    <p>Try another name, department, or college filter.</p>
                  </div>
                )}
              </section>
            )}
          </div>
        ) : activeSection === 'gpa' ? (
          <div className="dashboard-content gpa-content">
            <section className="gpa-hero">
              <div>
                <span className="section-kicker">PLAN YOUR ACADEMIC PROGRESS</span>
                <h1>GPA Calculator</h1>
                <p>Estimate your cumulative GPA on a 100-point scale using your current record and upcoming course grades.</p>
              </div>
              <span className="gpa-hero-icon" aria-hidden="true">％</span>
            </section>

            <div className="gpa-layout">
              <form className="dashboard-card gpa-form" onSubmit={calculateGpa}>
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">CURRENT RECORD + NEW COURSES</span>
                    <h2>Enter your GPA details</h2>
                  </div>
                </div>
                <p className="gpa-instructions">
                  Start with your current cumulative GPA and passed credit hours, then add the grades and credit hours for your new courses.
                </p>

                <div className="gpa-current-record">
                  <label>
                    <span>Current GPA <small>/ 100</small></span>
                    <input
                      type="number"
                      value={currentGpa}
                      onChange={(event) => {
                        setCurrentGpa(event.target.value);
                        setGpaResult(null);
                        setGpaError('');
                      }}
                      placeholder="e.g. 82.5"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </label>
                  <label>
                    <span>Passed credit hours</span>
                    <input
                      type="number"
                      value={passedCreditHours}
                      onChange={(event) => {
                        setPassedCreditHours(event.target.value);
                        setGpaResult(null);
                        setGpaError('');
                      }}
                      placeholder="e.g. 45"
                      min="0"
                      max="100"
                      step="0.5"
                      required
                    />
                  </label>
                </div>

                <p className="gpa-new-courses-label">New courses to include</p>
                <div className="gpa-course-list">
                  {gpaCourses.map((course, index) => (
                    <fieldset className="gpa-course-row" key={course.id}>
                      <legend>Course {index + 1}</legend>
                      <label className="gpa-course-name">
                        <span>Course name</span>
                        <input
                          type="text"
                          value={course.name}
                          onChange={(event) => updateGpaCourse(course.id, 'name', event.target.value)}
                          placeholder="e.g. Computer Networks"
                          maxLength={80}
                          required
                        />
                      </label>
                      <label>
                        <span>Grade <small>/ 100</small></span>
                        <input
                          type="number"
                          value={course.grade}
                          onChange={(event) => updateGpaCourse(course.id, 'grade', event.target.value)}
                          placeholder="e.g. 87"
                          min="0"
                          max="100"
                          step="0.01"
                          required
                        />
                      </label>
                      <label>
                        <span>Credit hours</span>
                        <input
                          type="number"
                          value={course.creditHours}
                          onChange={(event) => updateGpaCourse(course.id, 'creditHours', event.target.value)}
                          placeholder="e.g. 3"
                          min="0.5"
                          max="100"
                          step="0.5"
                          required
                        />
                      </label>
                      <button
                        className="remove-course-button"
                        type="button"
                        onClick={() => removeGpaCourse(course.id)}
                        disabled={gpaCourses.length === 1}
                        aria-label={`Remove course ${index + 1}`}
                      >
                        ×
                      </button>
                    </fieldset>
                  ))}
                </div>

                <button className="add-course-button" type="button" onClick={addGpaCourse}>
                  <span aria-hidden="true">＋</span> Add another course
                </button>

                {gpaError && <p className="gpa-error" role="alert">{gpaError}</p>}

                <button className="post-item-button calculate-gpa-button" type="submit">
                  Calculate cumulative GPA <span aria-hidden="true">→</span>
                </button>
              </form>

              <aside className="gpa-result-column">
                <section className={`gpa-result-card${gpaResult ? ' has-result' : ''}`} aria-live="polite">
                  <span className="gpa-result-label">ESTIMATED CUMULATIVE GPA</span>
                  {gpaResult ? (
                    <>
                      <p className="gpa-result-value">{gpaResult.average.toFixed(2)}<span> / 100</span></p>
                      <p className="gpa-classification">{gpaResult.classification}</p>
                      <p className="gpa-result-caption">After adding {gpaCourses.length} {gpaCourses.length === 1 ? 'course' : 'courses'}</p>
                      <div className="gpa-result-divider" />
                      <p className="gpa-credit-total">
                        Credits after new courses
                        <strong>{gpaResult.totalCredits}</strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="gpa-result-placeholder">—<span> / 100</span></p>
                      <p className="gpa-result-caption">Your calculated average will appear here.</p>
                    </>
                  )}
                </section>
              </aside>
            </div>
          </div>
        ) : activeSection === 'bus-tracker' ? (
          <div className="dashboard-content bus-tracker-content">
            <section className="bus-tracker-hero">
              <div>
                <span className="section-kicker">GET TO CAMPUS WITH EASE</span>
                <h1>University Bus Tracker</h1>
                <p>Choose a shuttle to see its last reported position and route stops.</p>
              </div>
              <span className="bus-hero-icon" aria-hidden="true">▣</span>
            </section>

            <p className="bus-demo-notice" role="note">
              Demo preview: bus positions and arrival times are sample data, not live GPS. Live locations will appear here after the bus GPS devices are connected.
            </p>

            <div className="bus-tracker-layout">
              <aside className="bus-route-panel">
                <section className="dashboard-card bus-choice-card">
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">CAMPUS SHUTTLES</span>
                      <h2>Choose a bus</h2>
                    </div>
                    <span className="listing-count">{demoBuses.length}</span>
                  </div>
                  <div className="bus-choice-list">
                    {demoBuses.map((bus) => (
                      <button
                        className={`bus-choice${selectedBusId === bus.id ? ' active' : ''}`}
                        key={bus.id}
                        type="button"
                        aria-pressed={selectedBusId === bus.id}
                        onClick={() => setSelectedBusId(bus.id)}
                      >
                        <span className="bus-choice-icon" aria-hidden="true">▣</span>
                        <span className="bus-choice-copy">
                          <strong>{bus.name}</strong>
                          <span>{bus.route}</span>
                        </span>
                        <span className="bus-choice-arrival">{bus.arrival}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="dashboard-card bus-stops-card">
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">NEXT STOP · {selectedBus.arrival}</span>
                      <h2>Route stops</h2>
                    </div>
                    <span className="bus-next-stop-icon" aria-hidden="true">⌖</span>
                  </div>
                  <p className="next-stop-name">{selectedBus.nextStop}</p>
                  <div className="bus-stop-list">
                    {selectedBus.stops.map((stop, index) => (
                      <div className={`bus-stop${index === 1 ? ' next' : ''}`} key={stop.name}>
                        <span className="bus-stop-line">
                          <i className={index === 0 ? 'passed' : ''} />
                        </span>
                        <strong>{stop.name}</strong>
                        <span>{stop.time}</span>
                      </div>
                    ))}
                  </div>
                  <p className="bus-last-updated">{selectedBus.lastUpdated}</p>
                </section>
              </aside>

              <section className="bus-map-card" aria-label={`Map showing ${selectedBus.name}`}>
                <div className="bus-map-heading">
                  <div>
                    <span className="section-kicker">SELECTED SHUTTLE</span>
                    <h2>{selectedBus.name}</h2>
                    <p>{selectedBus.route}</p>
                  </div>
                  <span className="bus-status"><i />{selectedBus.status}</span>
                </div>
                <div className="bus-map-frame">
                  <iframe
                    key={selectedBus.id}
                    src={mapUrl}
                    title={`Google Maps showing the sample location for ${selectedBus.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="map-coordinate-row">
                  <span><strong>Sample coordinates</strong>{selectedBus.latitude.toFixed(4)}, {selectedBus.longitude.toFixed(4)}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedBus.latitude},${selectedBus.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </section>
            </div>
            <p className="demo-notice">The map uses Google Maps. Sample bus data is temporary and resets when the app reloads; real-time tracking needs the university bus GPS feed.</p>
          </div>
        ) : activeSection === 'emails' ? (
          /* تبويب الإيميل */
          <div className="dashboard-content">
            <EmailsTab
              onSummarizeEmail={(email) => {
                window.dispatchEvent(new CustomEvent('unimate:ask-ai', {
                  detail: `Please summarize this email from ${email.sender} with subject "${email.subject}": ${email.preview}`
                }));
              }}
            />
          </div>
        ) : (
          <div className="dashboard-content news-content">
            <section className="news-hero">
              <div>
                <span className="section-kicker">THE LATEST FROM CAMPUS</span>
                <h1>GJU News</h1>
                <p>Stories, ideas, and updates from across the German Jordanian University community.</p>
              </div>
              <span className="news-hero-icon" aria-hidden="true">GJU</span>
            </section>

            <section className="news-email-connection">
              <div className="news-email-icon" aria-hidden="true">✉</div>
              <div className="news-email-copy">
                <span className="section-kicker">OUTLOOK NEWS SUBMISSIONS</span>
                <h2>Your connected Outlook emails</h2>
                <p>
                  Connect your matching GJU Outlook account to import all messages from Inbox and Sent Items, including existing mail. Imported messages are private to you. You choose which ones to submit for admin review; nothing is published automatically. Attachments are not imported.
                </p>
                {!userToken ? (
                  <p className="news-connection-help">Sign in with your student account to connect its matching GJU Outlook mailbox.</p>
                ) : outlookConnection?.connected ? (
                  <div className="news-connection-actions">
                    <button className="news-connect-button" type="button" onClick={syncOutlook} disabled={isOutlookBusy}>
                      {isOutlookBusy ? 'Checking…' : 'Check for news emails'}
                    </button>
                    <button className="news-disconnect-button" type="button" onClick={disconnectOutlook} disabled={isOutlookBusy}>
                      Disconnect
                    </button>
                  </div>
                ) : false ? (
                  <div className="outlook-setup-notice" role="status">
                    <strong>Outlook connection is not set up yet.</strong>
                    <span>The backend needs the university Microsoft app registration (tenant ID, client ID and secret, plus the registered callback URL) before Microsoft sign-in can start.</span>
                  </div>
                ) : true ? (
                  <button
                    className="news-connect-button"
                    type="button"
                    onClick={connectOutlook}
                    disabled={isOutlookBusy}
                  >
                    {isOutlookBusy ? 'Opening Microsoft…' : 'Connect GJU Outlook'} <span aria-hidden="true">↗</span>
                  </button>
                ) : (
                  <p className="news-connection-help" role="status">Checking whether Outlook is ready to connect…</p>
                )}
                {outlookMessage && <p className="news-connection-message" role="status">{outlookMessage}</p>}
                {userToken && outlookDrafts.length > 0 && (
                  <section className="outlook-private-drafts" aria-label="Your private Outlook email drafts">
                    <div className="outlook-drafts-heading">
                      <h3>Your Outlook emails <span className="listing-count">{outlookDrafts.length}{outlookDraftsOffset != null ? '+' : ''}</span></h3>
                      <span>Only you can see these until you submit one for review.</span>
                    </div>
                    <div className="outlook-drafts-list">
                      {outlookDrafts.map((draft) => (
                        <article className="outlook-private-draft" key={`${draft.source_folder}-${draft.id}`}>
                          <div className="outlook-private-draft-heading">
                            <strong>{draft.title}</strong>
                            <span>{formatFoundDate(draft.date)} · {draft.source_folder === 'inbox' ? 'Inbox' : 'Sent'} · {draft.sender_email}</span>
                          </div>
                          <p>{draft.summary || 'This email has no readable message body.'}</p>
                          <div className="outlook-private-draft-actions">
                            <span className={`outlook-draft-status outlook-draft-status-${draft.status}`}>
                              {draft.status === 'private' ? 'Private' : draft.status === 'pending' ? 'Pending admin review' : draft.status === 'published' ? 'Published' : 'Rejected'}
                            </span>
                            {draft.status === 'private' && (
                              <button type="button" onClick={() => submitOutlookDraft(draft)}>Submit for news review</button>
                            )}
                            {(draft.status === 'private' || draft.status === 'rejected') && (
                              <button className="outlook-draft-delete" type="button" onClick={() => deleteOutlookDraft(draft)}>Delete</button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                    {outlookDraftsOffset != null && (
                      <button
                        className="outlook-load-more"
                        type="button"
                        onClick={loadMoreOutlookDrafts}
                        disabled={isLoadingMoreOutlookDrafts}
                      >
                        {isLoadingMoreOutlookDrafts ? 'Loading…' : 'Load older emails'}
                      </button>
                    )}
                  </section>
                )}
              </div>
              <span className={`news-connection-status${outlookConnection?.connected ? ' is-connected' : ''}`}>
                {!userToken ? 'Student sign-in required' : outlookConnection?.connected ? `Connected · ${outlookConnection.email}` : 'Not connected'}
              </span>
            </section>

            <section className="news-feed">
              <div className="news-feed-heading">
                <div>
                  <span className="section-kicker">DISCOVER GJU</span>
                  <h2>Latest stories</h2>
                </div>
                <span className="news-count">{filteredNews.length} stories</span>
              </div>
              {isAdmin && (
                <section className="admin-news-manager" aria-label="Manage all news stories">
                  <div className="admin-news-heading">
                    <div>
                      <span className="section-kicker">ADMIN TOOLS</span>
                      <h2>Manage all news <span className="listing-count">{newsArticles.length}</span></h2>
                    </div>
                    <button className="post-item-button" type="button" onClick={() => openAdminEditor('news')}>
                      ＋ Add news
                    </button>
                  </div>
                  {!newsLoaded && (
                    <p className="admin-manager-note">Live news storage is unavailable. Apply the admin content migration and restart the backend before managing stories.</p>
                  )}
                  <section className="email-news-review" aria-label="Review Outlook news drafts">
                    <div className="admin-news-heading">
                      <div>
                        <span className="section-kicker">OUTLOOK SUBMISSIONS</span>
                        <h3>Pending email drafts <span className="listing-count">{pendingEmailDrafts.length}</span></h3>
                      </div>
                    </div>
                    {!emailDraftsLoaded ? (
                      <p className="admin-manager-note">Loading pending Outlook drafts…</p>
                    ) : pendingEmailDrafts.length ? (
                      <div className="admin-news-list">
                        {pendingEmailDrafts.map((draft) => (
                          <article className="email-news-draft" key={draft.id}>
                            <div className="email-news-draft-heading">
                              <strong>{draft.title}</strong>
                              <span>{formatFoundDate(draft.date)} · {draft.source_folder === 'inbox' ? 'Inbox' : 'Sent'} · {draft.student_email}</span>
                            </div>
                            <p>{draft.summary || 'This email has no readable message body.'}</p>
                            <div className="admin-card-actions">
                              {draft.source_url?.startsWith('https://') && (
                                <a href={draft.source_url} target="_blank" rel="noreferrer">Open email</a>
                              )}
                              <button type="button" onClick={() => publishEmailDraft(draft)}>Approve &amp; publish</button>
                              <button className="admin-delete-button" type="button" onClick={() => rejectEmailDraft(draft)}>Reject</button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-manager-note">No email drafts are waiting for review.</p>
                    )}
                  </section>
                  {adminEditor?.entity === 'news' && (
                    <AdminEditor
                      title={adminEditor.record ? 'Edit news story' : 'Add news story'}
                      fields={adminFields.news}
                      initialValues={adminEditor.record ? {
                        ...adminEditor.record,
                        read_time: adminEditor.record.readTime,
                      } : { date: getLocalDateString(), read_time: '3 min read' }}
                      onSave={handleAdminSave}
                      onCancel={closeAdminEditor}
                      saving={isAdminSaving}
                    />
                  )}
                  {newsArticles.length ? (
                    <div className="admin-news-list">
                      {newsArticles
                        .slice()
                        .sort((a, b) => getDateTimestamp(b.date) - getDateTimestamp(a.date))
                        .map((article) => (
                          <article className="admin-news-row" key={article.id}>
                            <div>
                              <strong>{article.title}</strong>
                              <span>{formatFoundDate(article.date)} · {article.category}</span>
                            </div>
                            <div className="admin-card-actions">
                              <button type="button" onClick={() => openAdminEditor('news', article)}>Edit</button>
                              <button className="admin-delete-button" type="button" onClick={() => deleteAdminRecord('news', article)}>Delete</button>
                            </div>
                          </article>
                        ))}
                    </div>
                  ) : (
                    <p className="admin-manager-note">No saved news stories yet.</p>
                  )}
                </section>
              )}
              <div className="news-controls">
                <label className="search-field">
                  <span className="sr-only">Search GJU news</span>
                  <span className="search-icon" aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    value={newsSearch}
                    onChange={(event) => setNewsSearch(event.target.value)}
                    placeholder="Search stories"
                  />
                </label>
                <label className="sr-only" htmlFor="news-category-filter">Filter by news category</label>
                <select
                  id="news-category-filter"
                  className="directory-select"
                  value={newsCategory}
                  onChange={(event) => setNewsCategory(event.target.value)}
                >
                  <option>All stories</option>
                  {newsCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              {featuredNews && (
                <article className="featured-news-card">
                  <div className="featured-news-art" aria-hidden="true">
                    <span>GJU</span>
                    <i />
                  </div>
                  <div className="featured-news-copy">
                    <span className="news-category">{featuredNews.category}</span>
                    <h3>{featuredNews.title}</h3>
                    <p>{featuredNews.summary}</p>
                    <div className="news-meta">
                      <time dateTime={featuredNews.date}>
                        {new Date(`${featuredNews.date}T12:00:00`).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </time>
                      <span>{featuredNews.readTime}</span>
                    </div>
                  </div>
                </article>
              )}
              {latestNews.length > 0 ? (
                <div className="news-card-grid">
                  {latestNews.map((article) => (
                    <article className="news-card" key={article.id}>
                      <div className={`news-card-art news-art-${article.category.toLowerCase().replaceAll(' ', '-')}`} aria-hidden="true">
                        <span>{article.category === 'Research' ? '✳' : article.category === 'Academics' ? '◈' : 'GJU'}</span>
                      </div>
                      <div className="news-card-copy">
                        <span className="news-category">{article.category}</span>
                        {article.emailSource && <span className="news-ai-label">AI email story · sample</span>}
                        <h3>{article.title}</h3>
                        <p>{article.summary}</p>
                        <div className="news-meta">
                          <time dateTime={article.date}>
                            {new Date(`${article.date}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </time>
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                !featuredNews && (
                  <div className="news-empty-state">No stories match your search. Try another keyword or category.</div>
                )
              )}
            </section>
          </div>
        )}
      </section>

      {/* الشات بوت العائم مع الوصول الكامل لبيانات النظام */}
      <ChatbotWidget
        contextData={{
          studentName,
          courses: semesterCourses,
          faculty: liveFaculty,
          buildings: liveBuildings,
          lostFound: foundItems,
          news: newsArticles,
        }}
      />
    </main>
  );
}