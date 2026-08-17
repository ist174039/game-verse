/**
 * Edge Function: daily-reward-cron
 *
 * Cron job (hourly): checks for users who haven't claimed daily reward
 * and sends reminder notifications. Resets streaks after 48h without claim.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 3600000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();

    // Find users who haven't claimed in 24h+
    const { data: staleRewards } = await supabase
      .from('daily_reward')
      .select('*')
      .lt('last_claimed_at', oneDayAgo)
      .gt('last_claimed_at', twoDaysAgo);

    let notified = 0;
    for (const reward of staleRewards ?? []) {
      await supabase.from('notification').insert({
        user_id: reward.user_id,
        type: 'daily_reminder',
        title: 'Recompensa Diária! 🎁',
        body: `Não te esqueças da recompensa! Streak atual: ${reward.streak} dias.`,
        data: { streak: reward.streak },
      });
      notified++;
    }

    // Reset streak for users with more than 48h without claim
    const { data: expiredRewards } = await supabase
      .from('daily_reward')
      .select('*')
      .lt('last_claimed_at', twoDaysAgo)
      .gt('streak', 0);

    for (const reward of expiredRewards ?? []) {
      await supabase.from('daily_reward').update({ streak: 0 }).eq('id', reward.id);
    }

    return new Response(
      JSON.stringify({ success: true, notified, streakReset: expiredRewards?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
