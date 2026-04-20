const VOICE_STYLES = {
  calm: 'warm, slow, deeply reassuring — like a trusted friend',
  steady: 'grounded, steady, matter-of-fact — like a seasoned guide',
  still: 'barely above a whisper, spacious, unhurried — like silence itself speaking',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { voice = 'calm', script_mode = 'scripted', duration_minutes = 10 } = req.body ?? {};

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Meditation service not configured' });
  }

  const style = VOICE_STYLES[voice] ?? VOICE_STYLES.calm;
  const wordTarget = Math.round(duration_minutes * 120); // ~120 words/min for slow speech
  const mode = script_mode === 'open'
    ? 'an open, unstructured meditation — long pauses, minimal words, space for the listener to arrive in their own experience'
    : 'a gently guided, body-scan meditation with soft breath cues and gradual relaxation';

  const prompt = `You are writing a guided meditation script to be read aloud by a voice AI.

Style: ${style}
Format: ${mode}
Target length: approximately ${wordTarget} words

Rules:
- Write only the spoken words — no stage directions, no scene labels
- Use natural spoken cadence with commas and ellipses for pauses
- Begin with 2–3 slow breath cues to settle the listener
- End with a gentle return to the room

Write the full meditation script now.`;

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
        max_tokens: Math.min(wordTarget * 2, 4000),
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI meditation error:', err);
      return res.status(502).json({ error: 'Generation failed' });
    }

    const data = await response.json();
    const meditation = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ meditation });
  } catch (err) {
    console.error('Meditation handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
