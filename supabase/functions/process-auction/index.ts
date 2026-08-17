/**
 * Edge Function: process-auction
 *
 * Cron job: processes expired auctions — transfers card, credits seller, deducts buyer.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const MARKET_FEE_PCT = 0.05;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: expiredAuctions } = await supabase
      .from('market_listing')
      .select('*')
      .eq('listing_type', 'auction')
      .eq('status', 'active')
      .lt('auction_ends_at', new Date().toISOString());

    let processed = 0;

    for (const listing of expiredAuctions ?? []) {
      const { data: topBid } = await supabase
        .from('auction_bid')
        .select('*')
        .eq('listing_id', listing.id)
        .order('amount', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (topBid) {
        const price = topBid.amount;
        const fee = Math.round(price * MARKET_FEE_PCT);
        const sellerReceives = price - fee;

        await supabase.from('market_listing').update({
          status: 'sold',
          buyer_id: topBid.bidder_id,
          sold_at: new Date().toISOString(),
          final_price: price,
        }).eq('id', listing.id);

        await supabase.from('card_ownership').update({ owner_id: topBid.bidder_id }).eq('id', listing.card_ownership_id);

        // Credit seller
        await supabase.rpc('credit_gc', {
          p_user_id: listing.seller_id,
          p_amount: sellerReceives,
          p_reason: `auction_sale_${listing.id}`,
          p_idempotency_key: `auction_sell_${listing.id}`,
        });

        // Notify buyer
        await supabase.from('notification').insert({
          user_id: topBid.bidder_id,
          type: 'auction',
          title: 'Leilão Ganho! 🎉',
          body: `Ganhaste o leilão por ${price} GC`,
          data: { listingId: listing.id, price },
        });
      } else {
        await supabase.from('market_listing').update({ status: 'expired' }).eq('id', listing.id);
      }

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
