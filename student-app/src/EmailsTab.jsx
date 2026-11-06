import React, { useState } from 'react';

const mockEmails = [
  {
    id: 1,
    sender: 'Dr. Ahmad Mansour',
    subject: 'CS301 - Midterm Exam Announcement',
    date: 'Today, 09:30 AM',
    preview: 'Please be reminded that the midterm exam will take place next Monday in Lab 3...',
    unread: true,
  },
  {
    id: 2,
    sender: 'GJU Registrar Office',
    subject: 'Spring Semester Registration Schedule',
    date: 'Yesterday',
    preview: 'Course registration for the upcoming semester will open according to completed credit hours...',
    unread: false,
  },
  {
    id: 3,
    sender: 'Faculty of Computer Studies',
    subject: 'UniMate Project Proposal Submission Deadline',
    date: 'Nov 4',
    preview: 'Kindly submit your team proposals via the portal no later than Thursday midnight...',
    unread: true,
  }
];

export default function EmailsTab({ onSummarizeEmail }) {
  const [emails] = useState(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState(null);

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>University Inbox (Outlook)</h2>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>Connected as Student</span>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {emails.map((email) => (
          <div
            key={email.id}
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: email.unread ? '1px solid #2563eb' : '1px solid #e5e7eb',
              backgroundColor: email.unread ? '#f0f7ff' : '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedEmail(email)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: email.unread ? '700' : '500', color: '#111827' }}>{email.sender}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{email.date}</span>
            </div>
            <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '6px', color: '#1f2937' }}>
              {email.subject}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, lineHeight: '1.4' }}>
              {email.preview}
            </p>

            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSummarizeEmail(email);
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Ask AI to Summarize
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}