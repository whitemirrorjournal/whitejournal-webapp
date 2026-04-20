export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { latest_entry } = req.body ?? {};
  if (!latest_entry) {
    return res.status(400).json({ error: 'Missing entry data' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Insights service not configured' });
  }

  const prompt = `You are a compassionate journaling coach reviewing someone's recent journal entries.

Here are their last entries:
${latest_entry}

Write a concise, warm weekly insight (3-4 sentences max) that:
- Notices a genuine pattern or theme in their writing
- Reflects it back without judgment
- Offers one small, concrete reframe or encouragement
- Feels personal, not generic

Write only the insight — no labels, no header, just the paragraph.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI insights error:', err);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() ?? '';
    return res.status(200).json({ result });
  } catch (err) {
    console.error('Insights handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
