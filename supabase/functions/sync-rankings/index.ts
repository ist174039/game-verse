/**
 * Edge Function: sync-rankings
 *
 * Cron job: recalculates global rankings and league divisions by Elo rating.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const DIVISIONS = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'];
const CLUBS_PER_DIVISION = 21;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: clubs } = await supabase
      .from('club')
      .select('id, name, elo_rating, division')
      .order('elo_rating', { ascending: false });

    if (!clubs?.length) {
      return new Response(JSON.stringify({ success: true, updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let updated = 0;
    for (let i = 0; i < clubs.length; i++) {
      const divisionIndex = Math.min(
        Math.floor(i / CLUBS_PER_DIVISION),
        DIVISIONS.length - 1,
      );
      const newDivision = DIVISIONS[divisionIndex];
      if (clubs[i].division !== newDivision) {
        await supabase.from('club').update({ division: newDivision }).eq('id', clubs[i].id);
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
