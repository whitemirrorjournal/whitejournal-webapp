import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  const { userId, phase, recentThemes } = req.body;

  if (!userId || !phase) {
        return res.status(400).json({ error: 'Missing userId or phase' });
  }

  try {
        const prompt = `
              You are the voice of White Mirror, a minimalist, brutalist self-reflection guide. 
                    The user is in Phase ${phase} of a 90-day journey.
                          Recent themes in their writing: ${recentThemes || 'New beginning'}.

                                Generate a single, profound, literary affirmation (10-20 words).
                                      Tone: Stoic, poetic, observant. No toxic positivity. Use "you" or "the".
                                            Example: "The depth of the water is not a threat, but an invitation to breathe differently."

                                                        Return only the text of the affirmation.
                                                            `;

      const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 60,
      });

      const affirmation = completion.choices[0].message.content.trim().replace(/^"|"$/g, '');

      res.status(200).json({ affirmation });
  } catch (error) {
        console.error('Affirmation AI error:', error);
        res.status(500).json({ error: 'Failed to generate affirmation' });
  }
}
