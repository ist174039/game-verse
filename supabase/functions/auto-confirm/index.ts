/**
 * Edge Function: auto-confirm
 *
 * Cron job: checks for matches with expired timeouts and auto-confirms them.
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

    const { data: expiredMatches } = await supabase
      .from('match')
      .select('*')
      .in('status', ['active', 'waiting_result'])
      .lt('timeout_at', new Date().toISOString());

    let processed = 0;

    for (const match of expiredMatches ?? []) {
      const hasResultA = !!match.result_a_submitted;
      const hasResultB = !!match.result_b_submitted;
      let finalResult: string;

      if (hasResultA && !hasResultB) {
        finalResult = match.result_a_submitted;
      } else if (!hasResultA && hasResultB) {
        finalResult = match.result_b_submitted;
      } else if (hasResultA && hasResultB) {
        finalResult = match.result_a_submitted;
      } else {
        finalResult = 'forfeit';
      }

      await supabase
        .from('match')
        .update({
          status: 'completed',
          final_result: finalResult,
          completed_at: new Date().toISOString(),
        })
        .eq('id', match.id);

      // Trigger process-match
      await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ matchId: match.id }),
        },
      );

      processed++;
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
