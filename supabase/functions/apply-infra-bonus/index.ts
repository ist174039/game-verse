/**
 * Edge Function: apply-infra-bonus
 *
 * Applies infrastructure bonus to match rewards (capped at 20%).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const INFRA_BONUS_CAP = 0.20;
const INFRA_MULTIPLIERS: Record<string, number> = {
  stadium: 0.04, academy: 0.04, training: 0.04, marketing: 0.04, finance: 0.04,
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { clubId, baseReward } = await req.json();
    if (!clubId || !baseReward) {
      return new Response(JSON.stringify({ error: 'clubId and baseReward required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: infras } = await supabase
      .from('club_infrastructure')
      .select('*')
      .eq('club_id', clubId)
      .eq('active', true);

    let totalBonusPct = 0;
    for (const infra of infras ?? []) {
      const multiplier = INFRA_MULTIPLIERS[infra.card_type] ?? 0.01;
      totalBonusPct += Math.min(multiplier * infra.level, 0.10);
    }

    const cappedBonusPct = Math.min(totalBonusPct, INFRA_BONUS_CAP);
    const finalReward = Math.round(baseReward * (1 + cappedBonusPct));

    return new Response(JSON.stringify({
      success: true, clubId, baseReward,
      totalBonusPct: Math.round(totalBonusPct * 100) / 100,
      cappedBonusPct: Math.round(cappedBonusPct * 100) / 100,
      finalReward,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
