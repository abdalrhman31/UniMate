import React, { useState, useEffect } from 'react';

export default function ChatbotWidget({ contextData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${contextData?.studentName || 'Student'}! 👋 I am your UniMate AI assistant. I have direct access to your courses, instructors, buildings, and campus news. How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // استقبال طلبات التلخيص التلقائية عند الضغط على زر "Ask AI to Summarize" من تبويب الإيميل
  useEffect(() => {
    const handleAskAiEvent = (event) => {
      setIsOpen(true);
      const query = event.detail;
      handleSendMessage(query);
    };

    window.addEventListener('unimate:ask-ai', handleAskAiEvent);
    return () => window.removeEventListener('unimate:ask-ai', handleAskAiEvent);
  }, [contextData]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    // إضافة رسالة المستخدم إلى الواجهة ومسح خانة الإدخال
    const userMsg = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    setIsLoading(true);

    try {
      // إرسال السؤال والسياق إلى السيرفر
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          contextData: contextData || {}
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.reply || data.response || data.message || "I didn't receive a response from the server.";

      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '⚠️ Unable to connect to UniMate server. Please ensure the backend is running on port 5000.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* الدائرة العائمة الصغيرة في الزاوية */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Assistant"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#003366',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        💬
      </button>

      {/* نافذة المحادثة */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '340px',
            height: '460px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            border: '1px solid #e2e8f0',
            fontFamily: 'inherit'
          }}
        >
          {/* Header */}
          <div style={{ backgroundColor: '#003366', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <strong>UniMate AI Assistant</strong>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.sender === 'user' ? '#003366' : '#f1f5f9',
                  color: m.sender === 'user' ? '#fff' : '#1e293b',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  maxWidth: '85%',
                  fontSize: '0.88rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-line'
                }}
              >
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontStyle: 'italic'
                }}
              >
                Thinking... ⏳
              </div>
            )}
          </div>

          {/* Input & Action Footer */}
          <div style={{ padding: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={input}
              placeholder="Ask about courses, doctors, news..."
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage()}
              style={{
                backgroundColor: isLoading ? '#94a3b8' : '#003366',
                color: '#fff',
                border: 'none',
                padding: '0 14px',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}