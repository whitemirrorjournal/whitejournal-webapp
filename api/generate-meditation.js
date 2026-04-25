import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const voicePersonas = {
  calm: 'a gentle, nurturing feminine voice — warm, soft, and grounding',
  steady: 'a steady masculine voice — firm, assured, and anchoring',
  still: 'a quiet, contemplative voice — minimal, spacious, and still',
  deep: 'a deep, resonant voice — slow, grounded, and protective',
  warm: 'a gentle, warm voice — intimate, kind, and steady',
};

const intentionStyles = {
  clarity: 'help the listener see one honest emotional pattern without forcing an answer',
  release: 'help the listener soften around a feeling they have been carrying',
  rest: 'help the listener settle their nervous system and allow repair',
  courage: 'help the listener reconnect with agency and one doable next step',
  self_worth: 'help the listener meet themselves with dignity and self-respect',
  closure: 'help the listener stop looping and leave one chapter with care',
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    voice = 'calm',
    script_mode = 'scripted',
    duration_minutes = 5,
    intention = 'clarity',
    phase = '',
    entries_summary = '',
  } = req.body;

  const persona = voicePersonas[voice] || voicePersonas.calm;
  const intentionStyle = intentionStyles[intention] || intentionStyles.clarity;
  const wordCount = Math.round(duration_minutes * 120);
  const style = script_mode === 'open'
    ? 'Use open, spacious language with long pauses implied, but still include occasional breath cues using the exact words “inhale”, “hold”, and “exhale” so the listener can practice with eyes closed.'
    : 'Begin with a brief White Mirror welcome and arrival cue, then use a structured 4-2-4 rhythm throughout. Verbally guide repeated cycles with the exact words “inhale”, “hold”, and “exhale”. The user will not receive separate breath cue audio, so the script itself must carry the breath timing.';
  const context = entries_summary
    ? `Use this journal context subtly, without quoting it directly:\nPhase: ${phase || 'unknown'}\nEntries:\n${entries_summary}`
    : `Phase: ${phase || 'unknown'}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are ${persona} guiding a ${duration_minutes}-minute meditation session for White Mirror. The intention is to ${intentionStyle}. Write approximately ${wordCount} words. ${style} Tone: honest, grounded, not overly spiritual. End with a return to the room. Do not use stage directions or timestamps; write only what the voice should say.\n\n${context}`,
      }],
      temperature: 0.6,
      max_tokens: Math.min(wordCount * 2, 1500),
    });

    const meditation = completion.choices[0].message.content.trim();
    res.status(200).json({ meditation, success: true });
  } catch (error) {
    console.error('Meditation error:', error);
    res.status(500).json({ error: 'Failed to generate meditation', success: false });
  }
}
