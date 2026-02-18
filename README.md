# 🛟 Helpdesk Chatbot

A full-stack AI-powered helpdesk chatbot widget built with **React**, **Express**, and **Google Gemini AI**. The chatbot appears as a floating widget on your website and answers user questions about the site's features, setup, troubleshooting, and more — all powered by a customizable FAQ knowledge base.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
  - [Frontend Flow](#frontend-flow)
  - [Backend Flow](#backend-flow)
  - [AI & Knowledge Base](#ai--knowledge-base)
- [Supported Queries](#supported-queries)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Customization](#customization)
- [Responsive Design](#responsive-design)
- [License](#license)

---

## Overview

This project provides a **plug-and-play helpdesk chatbot** that can be embedded into any website. Users interact with a floating chat bubble in the bottom-right corner of the page. When opened, a chat window appears where users can ask questions and receive AI-generated responses grounded in a predefined FAQ knowledge base.

Key highlights:

- 💬 **Floating chat widget** — non-intrusive, always accessible
- 🤖 **Google Gemini AI** — natural, conversational responses
- 📚 **FAQ knowledge base** — responses are grounded in your own data
- 🔄 **Conversation history** — maintains context within a chat session
- 🎨 **Dark-themed modern UI** — inspired by ChatGPT-style interfaces
- 📱 **Fully responsive** — works on desktop and mobile

---

## Architecture

```
┌──────────────────────┐        HTTP POST /api/chat        ┌──────────────────────┐
│                      │  ──────────────────────────────►   │                      │
│   React Frontend     │                                    │   Express Backend    │
│   (Vite Dev Server)  │  ◄──────────────────────────────   │                      │
│                      │        { reply: "..." }            │                      │
└──────────────────────┘                                    └──────────┬───────────┘
                                                                       │
                                                                       │ Gemini API
                                                                       ▼
                                                            ┌──────────────────────┐
                                                            │  Google Gemini AI    │
                                                            │  (gemini-2.5-flash-  │
                                                            │   lite)              │
                                                            └──────────────────────┘
```

- The **Frontend** (React + Vite) serves the chat widget UI and proxies API requests to the backend via Vite's dev server proxy.
- The **Backend** (Express.js) receives chat messages, constructs a system prompt from the FAQ knowledge base, and forwards the conversation to the Google Gemini API.
- **Google Gemini AI** generates natural language responses based on the system prompt and conversation history.

---

## Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Frontend   | React 19, Vite 7, Axios                                      |
| Backend    | Node.js, Express 5                                            |
| AI Model   | Google Gemini 2.5 Flash Lite (`@google/generative-ai` SDK)    |
| Styling    | Pure CSS (dark theme, responsive)                             |
| Dev Tools  | ESLint, dotenv                                                |

---

## Project Structure

```
├── Backend/                    # Express.js API server
│   ├── index.js                # Server entry point, route definitions
│   ├── chatController.js       # Chat endpoint logic, Gemini integration
│   ├── listModels.js           # Utility to list available Gemini models
│   ├── package.json            # Backend dependencies
│   └── .env                    # Environment variables (GEMINI_API_KEY)
│
├── Frontend/                   # React + Vite client
│   ├── src/
│   │   ├── App.jsx             # Main app with floating chat toggle
│   │   ├── App.css             # Page layout & chat popup styles
│   │   ├── Chatbot.jsx         # Chat widget component (messages, input, API calls)
│   │   ├── Chatbot.css         # Chat widget internal styles
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── index.html              # HTML shell
│   ├── vite.config.js          # Vite config with API proxy
│   └── package.json            # Frontend dependencies
│
├── .gitignore
└── README.md                   # ← You are here
```

---

## How It Works

### Frontend Flow

1. **App.jsx** renders the main page along with a **floating action button** (💬) fixed to the bottom-right corner.
2. When the user clicks the FAB, the `isOpen` state toggles to `true`, and a **chat popup** slides in with a smooth animation.
3. The popup contains a **header** (with title and close button) and the **`<Chatbot />`** component.
4. Each time the chat is closed and reopened, a **new `key`** is assigned to the `<Chatbot />` component, causing React to completely remount it — this ensures every session starts fresh.

### Chatbot Component (`Chatbot.jsx`)

1. **Initial state**: A default welcome message is displayed:
   > "👋 Welcome to the Helpdesk! I'm here to help you with questions about this website — features, setup, troubleshooting, and more."
2. **Sending a message**:
   - The user types in the textarea and presses **Enter** (or clicks the send button).
   - The message is appended to the local `messages` state and displayed immediately.
   - A **typing indicator** (three bouncing dots) appears while waiting for the response.
   - An HTTP `POST` request is sent to `/api/chat` with:
     - `message` — the current user input
     - `history` — all previous messages in the conversation (excluding the initial welcome and the current message)
   - On success, the AI reply is appended to the messages.
   - On error, a user-friendly error message is shown.
3. **Text formatting**: Bot responses support basic Markdown rendering:
   - `**bold**` → **bold**
   - `` `code` `` → `code`
   - `[link text](url)` → clickable hyperlink
   - Newlines are preserved as separate paragraphs.

### Backend Flow

1. **`index.js`** sets up the Express server with:
   - CORS enabled
   - JSON body parsing
   - A health-check route at `GET /`
   - A sample `GET /api/jokes` endpoint
   - The main `POST /api/chat` endpoint handled by `chatController.js`
2. The Vite dev server **proxies** all `/api/*` requests to `http://localhost:3000`, so frontend and backend communicate seamlessly during development.

### AI & Knowledge Base

1. **`chatController.js`** loads a **FAQ knowledge base** from a JSON file at startup.
2. A detailed **system prompt** is dynamically constructed containing:
   - The assistant's role and behavioral guidelines
   - Website metadata (name, description, URL, developer info, tech stack)
   - All FAQ entries organized by category
   - Rules for how to respond (paraphrase, be concise, ask clarifying questions, etc.)
3. When a chat request arrives:
   - The system prompt is injected as the first exchange in the conversation history.
   - Previous user/model messages are included to maintain context.
   - The full history is sent to **Google Gemini 2.5 Flash Lite** via `startChat()`.
   - The model generates a response, which is returned as JSON `{ reply: "..." }`.
4. **Error handling**:
   - `429` rate-limit errors return a friendly "high traffic" message.
   - Other errors return a generic "temporarily unavailable" message.

---

## Supported Queries

The chatbot is designed to handle the following types of queries:

### ✅ Website Information
- "What is this website about?"
- "Who built this website?"
- "What technologies are used?"
- "What is the tech stack?"

### ✅ Features & Functionality
- "What features does this website have?"
- "How does the chatbot work?"
- "What can I do on this site?"

### ✅ Setup & Installation
- "How do I set up this project locally?"
- "What are the prerequisites?"
- "How do I install dependencies?"
- "How do I run the app?"

### ✅ Troubleshooting
- "The chatbot isn't responding, what should I do?"
- "I'm getting an error, can you help?"
- "The page isn't loading properly."
- "Why am I seeing a 429 error?"

### ✅ General Helpdesk
- "How can I contact support?"
- "Where can I report a bug?"
- "Is there a GitHub repository?"

### ✅ Conversational
- "Hi" / "Hello" — the bot greets you warmly
- "Thank you" — the bot responds politely
- Follow-up questions — the bot maintains conversation context

### ⚠️ Out-of-Scope Queries
- Questions completely unrelated to the website are politely redirected. The bot will still try to be helpful but will note that it's best suited for website-related questions.
- The bot **never makes up information** about the website that isn't in the knowledge base.

> **Note:** The exact queries supported depend on the contents of your `faq.json` knowledge base file. The categories and Q&A pairs in that file directly determine what the bot can confidently answer. For questions not covered in the FAQ, the bot provides general advice and suggests contacting the developer.

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or later recommended)
- **npm** (comes with Node.js)
- A **Google Gemini API key** — get one at [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <project-root>
   ```

2. **Install backend dependencies:**
   ```bash
   cd Backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../Frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
PORT=3000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

| Variable         | Description                              | Required |
| ---------------- | ---------------------------------------- | -------- |
| `PORT`           | Port for the Express server (default: 3000) | No    |
| `GEMINI_API_KEY` | Your Google Gemini API key               | Yes      |

### Running the App

1. **Start the backend** (from the `Backend/` directory):
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`.

2. **Start the frontend** (from the `Frontend/` directory):
   ```bash
   npm run dev
   ```
   Vite will start on `http://localhost:5173` (default) and proxy `/api/*` requests to the backend.

3. **Open the app** at `http://localhost:5173` and click the 💬 button to start chatting!

---

## API Reference

### `GET /`
Health check endpoint.
- **Response:** `"Server is ready"`

### `GET /api/jokes`
Returns a list of 5 sample jokes.
- **Response:** Array of joke objects `[{ id, setup, punchline }]`

### `POST /api/chat`
Main chat endpoint — sends a message to the AI helpdesk assistant.

- **Request Body:**
  ```json
  {
    "message": "How do I set up the project?",
    "history": [
      { "role": "user", "text": "Hello" },
      { "role": "model", "text": "Hi! How can I help?" }
    ]
  }
  ```

  | Field     | Type     | Description                              | Required |
  | --------- | -------- | ---------------------------------------- | -------- |
  | `message` | `string` | The user's current message               | Yes      |
  | `history` | `array`  | Previous conversation messages           | No       |

- **Success Response (200):**
  ```json
  {
    "reply": "To set up the project, first clone the repository..."
  }
  ```

- **Error Responses:**
  - `400` — Missing message
  - `429` — Rate limit exceeded
  - `500` — Internal server error

---

## Customization

### Changing the Knowledge Base
Edit or create a `faq.json` file with the following structure:

```json
{
  "website": {
    "name": "Your Website Name",
    "description": "A brief description of your website",
    "url": "https://yourwebsite.com",
    "developer": {
      "name": "Your Name",
      "github": "https://github.com/yourusername"
    },
    "tech_stack": {
      "frontend": ["React", "Vite"],
      "backend": ["Node.js", "Express"],
      "ai_model": "Gemini 2.5 Flash Lite"
    }
  },
  "faq": [
    {
      "category": "General",
      "question": "What is this website?",
      "answer": "This website is..."
    }
  ]
}
```

### Changing the AI Model
In `chatController.js`, update the model name:
```js
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
```
You can use any available Gemini model (e.g., `gemini-2.0-flash`, `gemini-1.5-pro`, etc.).

### Styling
- **Chat popup appearance**: Edit `Frontend/src/App.css`
- **Chat widget internals**: Edit `Frontend/src/Chatbot.css`
- The widget uses a dark theme by default (background `#212121`, text `#ececec`).

---

## Responsive Design

The chat widget is fully responsive:

| Viewport        | Behavior                                                |
| --------------- | ------------------------------------------------------- |
| **Desktop**     | 400×560px popup, fixed to bottom-right corner           |
| **Mobile** (≤480px) | Nearly full-screen popup with reduced margins      |
| **FAB Button**  | 60px on desktop, 52px on mobile                         |

---

## License

ISC
