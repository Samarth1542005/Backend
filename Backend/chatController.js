import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const WEBSITE_CONTEXT = `
You are a helpful chatbot assistant for Samarth Jagdish Raut's website.

About the website:
- It is a full-stack web application built with React (Vite) on the frontend and Express.js on the backend.
- The website displays a collection of programming jokes fetched from the backend API.
- Available API routes:
  1. GET / — Returns "Server is ready"
  2. GET /api/jokes — Returns a list of 5 programming jokes, each with an id, setup, and punchline.
- The jokes are programming/tech-related humor.

About the developer:
- Name: Samarth Jagdish Raut
- GitHub: https://github.com/Samarth1542005

Instructions:
- If the user asks about the website, its features, or the developer, use the above context to answer.
- For general questions, answer helpfully like a normal AI assistant.
- Keep responses concise and friendly.
`;

export async function handleChat(req, res) {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    console.log("Processing chat request...");
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const chatHistory = (history || []).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: WEBSITE_CONTEXT }] },
        { role: 'model', parts: [{ text: 'Understood! I am ready to help users with questions about Samarth\'s website and general queries.' }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();
    console.log("AI Response generated successfully");

    res.json({ reply: response });
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    if (error.message && error.message.includes('429')) {
      res.status(429).json({ error: 'API quota exceeded. Please try again later or update the API key.' });
    } else {
      res.status(500).json({ error: 'Failed to get response from AI' });
    }
  }
}
