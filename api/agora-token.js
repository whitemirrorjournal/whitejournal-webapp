import { RtcTokenBuilder, RtcRole } from 'agora-token';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { channelName, uid } = req.body;
  if (!channelName || uid === undefined || uid === null) {
    return res.status(400).json({ error: 'Missing channelName or uid' });
  }

  try {
    const appId = process.env.AGORA_APP_ID;
    const appCert = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCert) {
      return res.status(500).json({ error: 'Agora credentials not configured' });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + 7200; // 2 hours

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCert,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    res.status(200).json({ token, success: true });
  } catch (error) {
    console.error('Agora token error:', error);
    res.status(500).json({ error: 'Failed to generate token', success: false });
  }
}
