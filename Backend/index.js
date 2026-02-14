import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { handleChat } from './chatController.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/' , (req,res) => {
    res.send('Server is ready');
})

//get a list of 5 jokes in object form

app.get('/api/jokes', (req,res) => {
    const jokes = [
        {
          "id": 1,
          "setup": "Why don't scientists trust atoms?",
          "punchline": "Because they make up everything!"
        },
        {
          "id": 2,
          "setup": "Why did the scarecrow win an award?",
          "punchline": "Because he was outstanding in his field!"
        },
        {
          "id": 3,
          "setup": "Why don't programmers like nature?",
          "punchline": "It has too many bugs."
        },
        {
          "id": 4,
          "setup": "Why do Java developers wear glasses?",
          "punchline": "Because they don't see sharp."
        },
        {
          "id": 5,
          "setup": "How many programmers does it take to change a light bulb?",
          "punchline": "None, that's a hardware problem."
        }
      ];
    res.send(jokes);
});

app.post('/api/chat', handleChat);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
