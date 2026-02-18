import { useState, useCallback } from 'react'
import Chatbot from './Chatbot'
import './App.css'

function App() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatKey, setChatKey] = useState(0)

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        // Chat is closing — bump key so it remounts fresh next time
        setChatKey((k) => k + 1)
      }
      return !prev
    })
  }, [])

  return (
    <div className="app-page">
      {/* Your main website content goes here */}
      <div className="page-content">
        <h1>Welcome to Our Website</h1>
        <p>This is your main webpage content. The chatbot is available in the bottom-right corner.</p>
      </div>

      {/* Floating chat widget */}
      {isOpen && (
        <div className="chatbot-popup">
          <div className="chatbot-popup-header">
            <span>🛟 Helpdesk Assistant</span>
            <button className="chatbot-close-btn" onClick={toggleChat} title="Close chat">
              ✕
            </button>
          </div>
          <Chatbot key={chatKey} />
        </div>
      )}

      {/* Floating toggle button */}
      {!isOpen && (
        <button className="chatbot-fab" onClick={toggleChat} title="Open chat">
          💬
        </button>
      )}
    </div>
  )
}

export default App
