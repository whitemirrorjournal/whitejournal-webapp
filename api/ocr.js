import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Missing image (base64)' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${image}` },
          },
          {
            type: 'text',
            text: 'Extract and transcribe all handwritten or printed text from this image exactly as written. Return only the extracted text, nothing else.',
          },
        ],
      }],
      max_tokens: 1000,
    });

    const text = completion.choices[0].message.content.trim();
    res.status(200).json({ text, success: true });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'Failed to perform OCR', success: false });
  }
}
