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

  const { latest_entry } = req.body;
  if (!latest_entry) return res.status(400).json({ error: 'Missing latest_entry' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are a perceptive journaling analyst for White Mirror, a brutalist self-reflection app. Read these journal entries and write a short, honest insight (2-4 sentences). Surface patterns the writer may not see clearly. Be direct, non-judgmental, and thoughtful.\n\nEntries:\n${latest_entry}`,
      }],
      temperature: 0.7,
      max_tokens: 200,
    });

    const result = completion.choices[0].message.content.trim();
    res.status(200).json({ result, success: true });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insight', success: false });
  }
}
