import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return res.status(401).json({ error: 'Unauthorized' });
    }

  const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

  try {
        const { error } = await supabase.rpc('update_mutual_streaks');
        if (error) throw error;
        res.status(200).json({ success: true, message: 'Streaks updated' });
  } catch (error) {
        console.error('Streak update error:', error);
        res.status(500).json({ error: error.message });
  }
}
