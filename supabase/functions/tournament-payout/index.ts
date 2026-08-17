/**
 * Edge Function: tournament-payout
 *
 * Distributes tournament prizes after completion.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const DEFAULT_DISTRIBUTION: Record<number, number> = {
  1: 50, 2: 30, 3: 15, 4: 5,
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { tournamentId } = await req.json();
    if (!tournamentId) {
      return new Response(JSON.stringify({ error: 'tournamentId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: economy } = await supabase
      .from('tournament_economy').select('*').eq('tournament_id', tournamentId).single();

    if (!economy) {
      return new Response(JSON.stringify({ error: 'Economy not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (economy.status !== 'ready') {
      return new Response(JSON.stringify({ error: 'Tournament not ready for distribution' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('tournament_economy').update({ status: 'distributing' }).eq('id', economy.id);

    const { data: participants } = await supabase
      .from('tournament_participant')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('final_position', { ascending: true });

    const distribution = economy.distribution_config ?? DEFAULT_DISTRIBUTION;
    const prizePool = economy.total_prize_pool;
    let totalDistributed = 0;

    for (const participant of participants ?? []) {
      const pct = distribution[participant.final_position] ?? 0;
      const amount = Math.round((prizePool * pct) / 100);
      if (amount <= 0) continue;

      const { data: payout } = await supabase
        .from('tournament_payout')
        .insert({
          tournament_id: tournamentId,
          club_id: participant.club_id,
          user_id: participant.user_id,
          position: participant.final_position,
          amount_gc: amount,
          status: 'pending',
        })
        .select('*')
        .single();

      const { error: creditError } = await supabase.rpc('credit_gc', {
        p_user_id: participant.user_id,
        p_amount: amount,
        p_idempotency_key: `tournament_payout_${tournamentId}_pos${participant.final_position}`,
      });

      const payoutStatus = creditError ? 'failed' : 'paid';
      await supabase.from('tournament_payout').update({
        status: payoutStatus,
        paid_at: payoutStatus === 'paid' ? new Date().toISOString() : null,
      }).eq('id', (payout as any).id);

      if (payoutStatus === 'paid') totalDistributed += amount;

      await supabase.from('notification').insert({
        user_id: participant.user_id,
        type: 'tournament_payout',
        title: `💰 Prémio: ${amount} GC!`,
        body: `Terminaste em ${participant.final_position}º e recebeste ${amount} GC.`,
        data: { tournament_id: tournamentId, position: participant.final_position, amount },
      });
    }

    await supabase.from('tournament_economy').update({
      status: 'distributed',
      total_distributed: totalDistributed,
      distributed_at: new Date().toISOString(),
    }).eq('id', economy.id);

    return new Response(
      JSON.stringify({ success: true, totalDistributed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
