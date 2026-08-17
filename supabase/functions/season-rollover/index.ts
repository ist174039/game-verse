/**
 * Edge Function: season-rollover
 *
 * Cron job (seasonal): processes league season completion with promotions/relegations.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const DIVISIONS = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'];
const PROMOTE_COUNT = 3;
const RELEGATE_COUNT = 3;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: completedSeasons } = await supabase
      .from('league_season').select('*').eq('status', 'completed');

    if (!completedSeasons?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No seasons to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const processed: string[] = [];

    for (const season of completedSeasons) {
      await supabase.from('league_season').update({ status: 'archived' }).eq('id', season.id);

      for (let i = 0; i < DIVISIONS.length; i++) {
        const division = DIVISIONS[i];
        const { data: entries } = await supabase
          .from('league_division_entry')
          .select('*')
          .eq('league_season_id', season.id)
          .eq('division', division)
          .order('points', { ascending: false })
          .order('goals_for', { ascending: false });

        if (!entries?.length) continue;

        // Assign ranks
        for (let r = 0; r < entries.length; r++) {
          await supabase.from('league_division_entry').update({ rank: r + 1 }).eq('id', entries[r].id);
        }

        // Promotions
        const nextDivision = DIVISIONS[i + 1];
        if (nextDivision) {
          for (const entry of entries.slice(0, PROMOTE_COUNT)) {
            await supabase.from('league_division_entry').update({ qualified_for_next: true }).eq('id', entry.id);
            const { data: club } = await supabase.from('club').select('user_id, name').eq('id', entry.club_id).single();
            if (club) {
              await supabase.from('notification').insert({
                user_id: club.user_id, type: 'league_promotion',
                title: `🎉 Promovido a ${nextDivision}!`,
                body: `${club.name} subiu para ${nextDivision}!`,
                data: { season_id: season.id, from: division, to: nextDivision },
              });
            }
          }
        }

        // Relegations
        const prevDivision = DIVISIONS[i - 1];
        if (prevDivision) {
          const { data: club } = await supabase.from('club').select('user_id, name').eq('id', entries[entries.length - 1].club_id).single();
          if (club) {
            await supabase.from('notification').insert({
              user_id: club.user_id, type: 'league_relegation',
              title: `⬇️ Despromovido a ${prevDivision}`,
              body: `${club.name} desceu para ${prevDivision}.`,
              data: { season_id: season.id, from: division, to: prevDivision },
            });
          }
        }
      }

      await supabase.from('news_event').insert({
        title: `🏆 Temporada ${season.season_year}.${season.season_number} concluída!`,
        body: 'Promoções e despromoções processadas. Nova temporada em breve.',
        category: 'league_promotion', importance: 'high',
        metadata: { season_id: season.id },
      });

      processed.push(season.name);
    }

    return new Response(JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
