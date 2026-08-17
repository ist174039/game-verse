/**
 * Edge Function: news-generator
 *
 * Generates narrative events based on platform activity.
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

    const generated: string[] = [];
    const fifteenMinAgo = new Date(Date.now() - 15 * 60000).toISOString();

    // 1. Match result news
    const { data: recentMatches } = await supabase
      .from('match').select('*').eq('status', 'completed').gte('completed_at', fifteenMinAgo);

    for (const match of recentMatches ?? []) {
      const { data: clubA } = await supabase.from('club').select('name').eq('id', match.club_a_id).single();
      const { data: clubB } = await supabase.from('club').select('name').eq('id', match.club_b_id).single();
      const nameA = (clubA as any)?.name ?? 'A';
      const nameB = (clubB as any)?.name ?? 'B';

      await supabase.from('news_event').insert({
        title: `⚽ ${nameA} vs ${nameB}: ${match.final_result}`,
        body: `Resultado final do jogo.`,
        category: 'match_result', importance: 'normal',
        related_match_id: match.id, related_club_id: match.club_a_id,
        published_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      generated.push(`${nameA} vs ${nameB}`);
    }

    // 2. Rivalry milestones
    const { data: rivalries } = await supabase
      .from('rivalry').select('*').eq('intensity', 'legendary').order('total_matches', { ascending: false }).limit(1);

    for (const riv of rivalries ?? []) {
      if (riv.total_matches % 10 === 0) {
        await supabase.from('news_event').insert({
          title: `🏆 Rivalidade Lendária: ${riv.total_matches} jogos!`,
          body: 'Uma das maiores rivalidades continua a crescer.',
          category: 'rivalry', importance: 'breaking',
          related_club_id: riv.club_a_id,
          metadata: { rivalry_id: riv.id, total_matches: riv.total_matches },
        });
        generated.push(`Rivalry: ${riv.total_matches} matches`);
      }
    }

    return new Response(JSON.stringify({ success: true, generated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
