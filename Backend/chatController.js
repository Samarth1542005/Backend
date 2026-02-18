import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load FAQ knowledge base
let knowledgeBase = {};
try {
  const faqPath = join(__dirname, '..', 'Chatbot', 'helpdesk-chatbot', 'src', 'knowledge', 'faq.json');
  knowledgeBase = JSON.parse(readFileSync(faqPath, 'utf-8'));
} catch (err) {
  console.warn('Warning: Could not load FAQ knowledge base:', err.message);
}

// Build the helpdesk system prompt from the knowledge base
function buildHelpdeskPrompt() {
  const website = knowledgeBase.website || {};
  const faqs = knowledgeBase.faq || [];

  let prompt = `You are a **Helpdesk Assistant** for "${website.name || 'this website'}".

YOUR ROLE:
- You are a friendly, professional helpdesk support agent.
- Your primary job is to help users with questions about THIS website, its features, setup, troubleshooting, and usage.
- You should answer based on the knowledge base provided below.
- If a user's question matches or is related to an FAQ, use that answer as your basis but respond naturally and conversationally.
- If the question is NOT covered in the knowledge base, you may provide general helpful advice, but always mention that the user can contact the developer for more specific help.
- NEVER make up information about the website that isn't in the knowledge base.
- Keep responses concise, helpful, and well-formatted using markdown (bold, bullet points, numbered lists).
- If the user greets you, greet them back warmly and ask how you can help.

WEBSITE INFORMATION:
- Name: ${website.name || 'N/A'}
- Description: ${website.description || 'N/A'}
- URL: ${website.url || 'N/A'}
- Developer: ${website.developer?.name || 'N/A'}
- GitHub: ${website.developer?.github || 'N/A'}
- Tech Stack: Frontend — ${(website.tech_stack?.frontend || []).join(', ')} | Backend — ${(website.tech_stack?.backend || []).join(', ')} | AI Model — ${website.tech_stack?.ai_model || 'N/A'}

KNOWLEDGE BASE (FAQs):
`;

  faqs.forEach((faq, i) => {
    prompt += `\n[${faq.category}] Q${i + 1}: ${faq.question}\nA${i + 1}: ${faq.answer}\n`;
  });

  prompt += `
GUIDELINES:
- When answering, refer to the FAQs above. Paraphrase naturally — do NOT just copy-paste answers.
- If a user asks something ambiguous, ask a clarifying question.
- For troubleshooting, walk the user through steps one at a time if needed.
- Always be polite and end with asking if there's anything else you can help with.
- If someone asks something completely unrelated to the website, politely redirect them and say you're best suited to help with website-related questions, but still try to be helpful.
`;

  return prompt;
}

const HELPDESK_PROMPT = buildHelpdeskPrompt();

export async function handleChat(req, res) {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    console.log('Processing helpdesk query:', message.substring(0, 80));

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const chatHistory = (history || []).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: HELPDESK_PROMPT }] },
        {
          role: 'model',
          parts: [
            {
              text: "Understood! I'm now acting as the Helpdesk Assistant for this website. I have the full knowledge base loaded and I'm ready to help users with their questions about the website, features, troubleshooting, setup, and more. I'll be friendly, concise, and professional.",
            },
          ],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();
    console.log('Helpdesk response generated successfully');

    res.json({ reply: response });
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    if (error.message && error.message.includes('429')) {
      res.status(429).json({
        error:
          'We are experiencing high traffic right now. Please wait a moment and try again.',
      });
    } else {
      res.status(500).json({
        error:
          'Sorry, the helpdesk is temporarily unavailable. Please try again later or contact support directly.',
      });
    }
  }
}
