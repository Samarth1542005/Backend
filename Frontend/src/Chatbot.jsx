import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

const STORAGE_KEY = 'chatbot_conversations';
const ACTIVE_KEY = 'chatbot_active_id';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getDefaultMessage() {
  return { role: 'model', text: "Hi! I'm Samarth's AI assistant. How can I help you today?" };
}

function loadConversations() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {}
  const id = generateId();
  return [{ id, title: 'New Chat', messages: [getDefaultMessage()] }];
}

function loadActiveId(conversations) {
  const stored = localStorage.getItem(ACTIVE_KEY);
  if (stored && conversations.find((c) => c.id === stored)) return stored;
  return conversations[0].id;
}

function Chatbot() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(() => loadActiveId(conversations));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeConvo = conversations.find((c) => c.id === activeId) || conversations[0];
  const messages = activeConvo.messages;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  const updateConversation = (id, updater) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? updater(c) : c))
    );
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user', text: trimmed };
    const updatedMessages = [...messages, userMessage];

    const isFirstUserMsg = !messages.some((m) => m.role === 'user');
    const newTitle = isFirstUserMsg ? trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '') : activeConvo.title;

    updateConversation(activeId, (c) => ({
      ...c,
      title: newTitle,
      messages: updatedMessages,
    }));
    setInput('');
    setIsLoading(true);

    try {
      const history = updatedMessages.slice(1, -1);
      const res = await axios.post('/api/chat', {
        message: trimmed,
        history,
      });
      updateConversation(activeId, (c) => ({
        ...c,
        messages: [...c.messages, { role: 'model', text: res.data.reply }],
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Sorry, something went wrong. Please try again.';
      updateConversation(activeId, (c) => ({
        ...c,
        messages: [...c.messages, { role: 'model', text: errorMsg }],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createNewChat = () => {
    const id = generateId();
    const newConvo = { id, title: 'New Chat', messages: [getDefaultMessage()] };
    setConversations((prev) => [newConvo, ...prev]);
    setActiveId(id);
    setInput('');
  };

  const deleteConversation = (id) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const newId = generateId();
        const newConvo = { id: newId, title: 'New Chat', messages: [getDefaultMessage()] };
        setActiveId(newId);
        return [newConvo];
      }
      if (activeId === id) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
    });
  };

  return (
    <div className="chatgpt-layout">
      <aside className={`chatgpt-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat}>
            <span className="plus-icon">+</span> New Chat
          </button>
          <button className="sidebar-toggle-inner" onClick={() => setSidebarOpen(false)} title="Close sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7" /><path d="M18 19l-7-7 7-7" /></svg>
          </button>
        </div>
        <div className="sidebar-conversations">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`sidebar-convo-item ${convo.id === activeId ? 'active' : ''}`}
              onClick={() => { setActiveId(convo.id); setInput(''); }}
            >
              <span className="convo-icon">💬</span>
              <span className="convo-title">{convo.title}</span>
              <button
                className="convo-delete"
                onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                title="Delete chat"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-footer-item">
            <span>🧑‍💻</span> Samarth's Assistant
          </div>
        </div>
      </aside>

      <main className="chatgpt-main">
        <header className="chatgpt-topbar">
          {!sidebarOpen && (
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </button>
          )}
          <h1 className="topbar-title">{activeConvo.title}</h1>
        </header>

        <div className="chatgpt-messages">
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <div className="avatar user-avatar">S</div>
                  ) : (
                    <div className="avatar model-avatar">✦</div>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-role">{msg.role === 'user' ? 'You' : 'Assistant'}</div>
                  <div className="message-text">{formatText(msg.text)}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row model">
                <div className="message-avatar">
                  <div className="avatar model-avatar">✦</div>
                </div>
                <div className="message-content">
                  <div className="message-role">Assistant</div>
                  <div className="message-text typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chatgpt-input-wrapper">
          <div className="chatgpt-input-container">
            <textarea
              ref={inputRef}
              className="chatgpt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Samarth's Assistant..."
              disabled={isLoading}
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              title="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
          <p className="input-disclaimer">
            Samarth's Assistant can make mistakes. Consider checking important information.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Chatbot;
