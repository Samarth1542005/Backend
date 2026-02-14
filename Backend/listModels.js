import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    // basic check, but real list is better. SDK doesn't always have easy list helper in older versions?
    // actually, let's just use curl to list models, it's more reliable to see raw response.
  } catch (e) {
    console.error(e);
  }
}
// listModels();
