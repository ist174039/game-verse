/**
 * Edge Function: process-match
 *
 * Processes a completed match: Elo calculation, GC rewards, infra bonuses.
 * Triggered by database trigger or POST request.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ELO_K = 16;
const REWARDS = { win: 150, draw: 50, loss: 0 };

function calculateElo(ro: number, opponent: number, actual: number): number {
  const expected = 1 / (1 + Math.pow(10, (opponent - ro) / 400));
  return Math.round(ELO_K * (actual - expected));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { matchId } = await req.json();
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'matchId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get match
    const { data: match } = await supabase
      .from('match').select('*').eq('id', matchId).single();
    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get clubs
    const { data: clubA } = await supabase
      .from('club').select('*').eq('id', match.club_a_id).single();
    const { data: clubB } = await supabase
      .from('club').select('*').eq('id', match.club_b_id).single();
    if (!clubA || !clubB) throw new Error('Clubs not found');

    // 3. Calculate Elo
    const [scoreA, scoreB] = (match.final_result ?? '0-0').split('-').map(Number);
    const resultA = scoreA! > scoreB! ? 1 : scoreA === scoreB ? 0.5 : 0;
    const resultB = 1 - resultA;

    const eloChangeA = calculateElo(clubA.elo_rating ?? 1200, clubB.elo_rating ?? 1200, resultA);
    const eloChangeB = calculateElo(clubB.elo_rating ?? 1200, clubA.elo_rating ?? 1200, resultB);

    // 4. Update Elo
    await supabase.from('club').update({ elo_rating: (clubA.elo_rating ?? 1200) + eloChangeA }).eq('id', clubA.id);
    await supabase.from('club').update({ elo_rating: (clubB.elo_rating ?? 1200) + eloChangeB }).eq('id', clubB.id);

    // 5. Record Elo history
    await supabase.from('elo_history').insert([
      { club_id: clubA.id, match_id: matchId, elo_before: clubA.elo_rating ?? 1200, elo_after: (clubA.elo_rating ?? 1200) + eloChangeA, elo_change: eloChangeA },
      { club_id: clubB.id, match_id: matchId, elo_before: clubB.elo_rating ?? 1200, elo_after: (clubB.elo_rating ?? 1200) + eloChangeB, elo_change: eloChangeB },
    ]);

    // 6. Distribute rewards
    const rewardA = resultA === 1 ? REWARDS.win : resultA === 0.5 ? REWARDS.draw : REWARDS.loss;
    const rewardB = resultB === 1 ? REWARDS.win : resultB === 0.5 ? REWARDS.draw : REWARDS.loss;

    if (rewardA > 0) {
      await supabase.rpc('credit_gc', {
        p_user_id: clubA.user_id,
        p_amount: rewardA,
        p_reason: `match_reward_${matchId}_A`,
        p_idempotency_key: `match_${matchId}_clubA`,
      });
    }
    if (rewardB > 0) {
      await supabase.rpc('credit_gc', {
        p_user_id: clubB.user_id,
        p_amount: rewardB,
        p_reason: `match_reward_${matchId}_B`,
        p_idempotency_key: `match_${matchId}_clubB`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        eloChanges: { [clubA.id]: eloChangeA, [clubB.id]: eloChangeB },
        rewards: { [clubA.id]: rewardA, [clubB.id]: rewardB },
      }),
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
