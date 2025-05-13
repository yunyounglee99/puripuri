// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors(), express.json());

// Mathpix OCR 라우트
app.post('/api/ocr', async (req, res) => {
  try {
    const { src } = req.body;
    const mpRes = await axios.post(
      'https://api.mathpix.com/v3/text',
      { src, formats: ['latex'], ocr: ['math','text'] },
      { headers: {
          app_id: process.env.MATHPIX_APP_ID,
          app_key: process.env.MATHPIX_APP_KEY,
      }}
    );
    res.json({ latex: mpRes.data.latex });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'OCR error' });
  }
});

// GPT 힌트 생성 라우트
app.post('/api/generate-hint', async (req, res) => {
  try {
    const { prompt } = req.body;
    const gptRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You are a helpful tutor.' },
                   { role: 'user', content: prompt }],
      },
      { headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        }}
    );
    const hint = gptRes.data.choices[0].message.content.trim();
    res.json({ hint });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'GPT error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));