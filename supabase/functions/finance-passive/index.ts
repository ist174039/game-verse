/**
 * Edge Function: finance-passive
 *
 * Cron job (daily): processes passive income from sponsorships, investments, and loans.
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
    let processedSponsorships = 0;
    let processedLoans = 0;
    let processedInvestments = 0;

    // 1. Process active sponsorships
    const { data: sponsorships } = await supabase
      .from('club_sponsorship')
      .select('*')
      .eq('active', true)
      .gte('ends_at', now.toISOString());

    for (const sp of sponsorships ?? []) {
      const dailyIncome = Math.round((sp.cost_gc * sp.bonus_percent) / 100 / 30);
      if (dailyIncome > 0) {
        const { data: club } = await supabase.from('club').select('user_id').eq('id', sp.club_id).single();
        if (club) {
          await supabase.rpc('credit_gc', {
            p_user_id: club.user_id,
            p_amount: dailyIncome,
            p_reason: `sponsorship_${sp.sponsor_type}_${sp.id}`,
          });
          processedSponsorships++;
        }
      }
    }

    // 2. Check overdue loans
    const { data: overdueLoans } = await supabase
      .from('loan').select('*').eq('status', 'active').lt('due_date', now.toISOString());

    for (const loan of overdueLoans ?? []) {
      if (loan.remaining_balance > 0) {
        await supabase.from('loan').update({ status: 'defaulted' }).eq('id', loan.id);
        const { data: club } = await supabase.from('club').select('user_id').eq('id', loan.club_id).single();
        if (club) {
          await supabase.from('notification').insert({
            user_id: club.user_id,
            type: 'loan_default',
            title: 'Empréstimo em Incumprimento ⚠️',
            body: `O empréstimo de ${loan.amount_gc} GC entrou em incumprimento.`,
            data: { loan_id: loan.id },
          });
        }
        processedLoans++;
      }
    }

    // 3. Complete investments for ended seasons
    const { data: completedSeasons } = await supabase
      .from('league_season').select('season_year').eq('status', 'completed').lt('ends_at', now.toISOString());

    const completedYears = [...new Set((completedSeasons ?? []).map((s: any) => s.season_year))];

    for (const year of completedYears) {
      const { data: investments } = await supabase
        .from('investment_contract').select('*').eq('status', 'active').eq('season_year', year);

      for (const inv of investments ?? []) {
        const profit = Math.round(inv.amount_gc * (inv.profit_percent / 100));
        const totalPayout = inv.amount_gc + profit;

        await supabase.rpc('credit_gc', {
          p_user_id: inv.investor_id,
          p_amount: totalPayout,
          p_reason: `investment_return_${inv.id}`,
        });

        await supabase.from('investment_contract').update({
          status: 'completed',
          completed_at: now.toISOString(),
        }).eq('id', inv.id);

        processedInvestments++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processedSponsorships, processedLoans, processedInvestments }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
