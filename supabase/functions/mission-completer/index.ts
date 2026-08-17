/**
 * Edge Function: mission-completer
 *
 * Checks and completes missions based on activity triggers.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { userId, eventType, value = 1 } = await req.json();
    if (!userId || !eventType) {
      return new Response(JSON.stringify({ error: 'userId and eventType required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userMissions } = await supabase
      .from('user_mission')
      .select('*, mission(*)')
      .eq('user_id', userId)
      .eq('status', 'active');

    let updated = 0;
    for (const um of userMissions ?? []) {
      const mission = um.mission as any;
      const eventKey = mission.criteria?.event_type;
      if (eventKey !== eventType) continue;

      const newProgress = um.progress + value;
      if (newProgress >= um.target && um.progress < um.target) {
        await supabase.from('user_mission').update({
          progress: Math.min(newProgress, um.target),
          status: 'completed',
          completed_at: new Date().toISOString(),
        }).eq('id', um.id);

        await supabase.from('notification').insert({
          user_id: userId, type: 'mission_complete',
          title: 'Missão Completa! 🎉',
          body: `${mission.title} — Reclama a recompensa!`,
          data: { mission_id: mission.id, reward_gc: mission.reward_gc },
        });
      } else {
        await supabase.from('user_mission').update({ progress: Math.min(newProgress, um.target) }).eq('id', um.id);
      }
      updated++;
    }

    return new Response(JSON.stringify({ success: true, updated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
