import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Chatbot.css';

function getDefaultMessage() {
  return { role: 'model', text: "👋 Welcome to the Helpdesk! I'm here to help you with questions about this website — features, setup, troubleshooting, and more. How can I assist you today?" };
}

function Chatbot() {
  const [messages, setMessages] = useState([getDefaultMessage()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user', text: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = updatedMessages.slice(1, -1);
      const res = await axios.post('/api/chat', {
        message: trimmed,
        history,
      });
      setMessages((prev) => [...prev, { role: 'model', text: res.data.reply }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Sorry, something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'model', text: errorMsg }]);
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

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
      formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
    });
  };

  return (
    <div className="chatbot-widget">
      <div className="chatbot-messages">
        <div className="chatbot-messages-inner">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message-row ${msg.role}`}>
              <div className="chat-message-avatar">
                {msg.role === 'user' ? (
                  <div className="chat-avatar user-avatar">U</div>
                ) : (
                  <div className="chat-avatar model-avatar">🛟</div>
                )}
              </div>
              <div className="chat-message-content">
                <div className="chat-message-role">{msg.role === 'user' ? 'You' : 'Helpdesk'}</div>
                <div className="chat-message-text">{formatText(msg.text)}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message-row model">
              <div className="chat-message-avatar">
                <div className="chat-avatar model-avatar">🛟</div>
              </div>
              <div className="chat-message-content">
                <div className="chat-message-role">Helpdesk</div>
                <div className="chat-message-text typing-indicator">
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

      <div className="chatbot-input-wrapper">
        <div className="chatbot-input-container">
          <textarea
            ref={inputRef}
            className="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the helpdesk anything..."
            disabled={isLoading}
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            title="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
