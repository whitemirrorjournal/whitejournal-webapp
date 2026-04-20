export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body ?? {};
  if (!image) {
    return res.status(400).json({ success: false, error: 'Missing image' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'OCR service not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all handwritten or printed text from this journal page image. Return only the raw text, preserving line breaks. Do not add commentary.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${image}`, detail: 'high' },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI OCR error:', err);
      return res.status(502).json({ success: false, error: 'OCR failed' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('OCR handler error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
