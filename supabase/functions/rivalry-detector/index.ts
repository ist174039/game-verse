/**
 * Edge Function: rivalry-detector
 *
 * Detects and updates rivalries after each completed match.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function calculateIntensity(matches: number, aWins: number, bWins: number): string {
  if (matches >= 20) {
    const balance = Math.min(aWins, bWins) / Math.max(Math.max(aWins, bWins), 1);
    if (balance > 0.8) return 'legendary';
    if (balance > 0.6) return 'established';
  }
  if (matches >= 10) return 'established';
  if (matches >= 5) return 'growing';
  return 'emerging';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { matchId } = await req.json();
    if (!matchId) {
      return new Response(JSON.stringify({ error: 'matchId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: match } = await supabase.from('match').select('*').eq('id', matchId).eq('status', 'completed').single();
    if (!match) {
      return new Response(JSON.stringify({ error: 'Match not found or not completed' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [first, second] = [match.club_a_id, match.club_b_id].sort();

    const { data: existing } = await supabase
      .from('rivalry')
      .select('*')
      .eq('club_a_id', first)
      .eq('club_b_id', second)
      .maybeSingle();

    const prev = existing as any ?? {};
    const aWins = (prev.club_a_wins ?? 0) + (match.winner_id === match.club_a_id ? 1 : 0);
    const bWins = (prev.club_b_wins ?? 0) + (match.winner_id === match.club_b_id ? 1 : 0);
    const draws = (prev.draws ?? 0) + (match.winner_id ? 0 : 1);
    const totalMatches = (prev.total_matches ?? 0) + 1;
    const intensity = calculateIntensity(totalMatches, aWins, bWins);

    await supabase.from('rivalry').upsert({
      club_a_id: first,
      club_b_id: second,
      total_matches: totalMatches,
      club_a_wins: aWins,
      club_b_wins: bWins,
      draws,
      intensity,
      last_match_at: match.completed_at ?? new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, totalMatches, intensity }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
