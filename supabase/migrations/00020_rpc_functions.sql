-- Migration 00020: RPC Functions for GameVerse Economy & Operations
-- All RPC functions used by the frontend components

-- ===== DEDUCT_BALANCE =====
-- Deducts GC from user's wallet safely with transaction record
CREATE OR REPLACE FUNCTION public.deduct_balance(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Infrastructure upgrade'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get wallet
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallet
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  v_new_balance := v_balance - p_amount;

  -- Update wallet
  UPDATE public.wallet
  SET balance = v_new_balance,
      total_spent = total_spent + p_amount,
      updated_at = now()
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO public.coin_transaction (wallet_id, user_id, amount, type, source_type, description, balance_after)
  VALUES (v_wallet_id, p_user_id, p_amount, 'debit', 'admin_deduction', p_description, v_new_balance);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- ===== CREDIT_GC =====
-- Credits GC to user's wallet safely with transaction record and idempotency key
CREATE OR REPLACE FUNCTION public.credit_gc(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT DEFAULT 'System credit',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance INTEGER;
  v_new_balance INTEGER;
  v_exists BOOLEAN;
BEGIN
  -- Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.coin_transaction
      WHERE idempotency_key = p_idempotency_key
    ) INTO v_exists;

    IF v_exists THEN
      RETURN jsonb_build_object('success', false, 'error', 'Duplicate transaction');
    END IF;
  END IF;

  -- Get wallet
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallet
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  v_new_balance := v_balance + p_amount;

  -- Update wallet
  UPDATE public.wallet
  SET balance = v_new_balance,
      total_earned = total_earned + p_amount,
      updated_at = now()
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO public.coin_transaction (
    wallet_id, user_id, amount, type, source_type, description, balance_after, idempotency_key
  ) VALUES (
    v_wallet_id, p_user_id, p_amount, 'credit', 'admin_grant',
    CASE
      WHEN p_reason LIKE 'match_%' THEN 'Match reward'
      WHEN p_reason LIKE 'tournament_%' THEN 'Tournament prize'
      WHEN p_reason LIKE 'sponsorship_%' THEN 'Sponsorship income'
      WHEN p_reason LIKE 'investment_%' THEN 'Investment return'
      WHEN p_reason LIKE 'daily_%' THEN 'Daily reward'
      WHEN p_reason = 'System credit' THEN p_description
      ELSE p_reason
    END,
    v_new_balance, p_idempotency_key
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- ===== BUY_MARKET_LISTING =====
-- Complete purchase of a market listing with escrow and fee calculation
CREATE OR REPLACE FUNCTION public.buy_market_listing(
  p_listing_id UUID,
  p_buyer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_listing RECORD;
  v_buyer_wallet RECORD;
  v_seller_wallet RECORD;
  v_fee INTEGER;
  v_seller_net INTEGER;
  v_buyer_new_balance INTEGER;
  v_seller_new_balance INTEGER;
  v_ownership_id UUID;
BEGIN
  -- Get listing with lock
  SELECT * INTO v_listing
  FROM public.market_listing
  WHERE id = p_listing_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found or not active');
  END IF;

  -- Cannot buy own listing
  IF v_listing.seller_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own listing');
  END IF;

  -- Get buyer wallet
  SELECT * INTO v_buyer_wallet
  FROM public.wallet
  WHERE user_id = p_buyer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Buyer wallet not found');
  END IF;

  IF v_buyer_wallet.balance < v_listing.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get seller wallet
  SELECT * INTO v_seller_wallet
  FROM public.wallet
  WHERE user_id = v_listing.seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seller wallet not found');
  END IF;

  -- Calculate fees (5% platform fee)
  v_fee := GREATEST(1, ROUND(v_listing.price * 0.05));
  v_seller_net := v_listing.price - v_fee;

  -- Update buyer wallet
  v_buyer_new_balance := v_buyer_wallet.balance - v_listing.price;
  UPDATE public.wallet
  SET balance = v_buyer_new_balance,
      total_spent = total_spent + v_listing.price,
      updated_at = now()
  WHERE id = v_buyer_wallet.id;

  -- Update seller wallet
  v_seller_new_balance := v_seller_wallet.balance + v_seller_net;
  UPDATE public.wallet
  SET balance = v_seller_new_balance,
      total_earned = total_earned + v_seller_net,
      updated_at = now()
  WHERE id = v_seller_wallet.id;

  -- Transfer card ownership
  UPDATE public.card_ownership
  SET owner_id = p_buyer_id,
      is_listed = false
  WHERE id = v_listing.card_ownership_id
  RETURNING id INTO v_ownership_id;

  -- Mark listing as sold
  UPDATE public.market_listing
  SET status = 'sold',
      buyer_id = p_buyer_id,
      final_price = v_listing.price,
      sold_at = now(),
      updated_at = now()
  WHERE id = p_listing_id;

  -- Create buyer transaction
  INSERT INTO public.coin_transaction (wallet_id, user_id, amount, type, source_type, description, balance_after)
  VALUES (v_buyer_wallet.id, p_buyer_id, v_listing.price, 'debit', 'market_purchase', 
          'Purchase of listing', v_buyer_new_balance);

  -- Create seller transaction
  INSERT INTO public.coin_transaction (wallet_id, user_id, amount, type, source_type, description, balance_after)
  VALUES (v_seller_wallet.id, v_listing.seller_id, v_seller_net, 'credit', 'market_sale', 
          'Sale of listing (fee: ' || v_fee || ' GC)', v_seller_new_balance);

  RETURN jsonb_build_object(
    'success', true,
    'buyer_new_balance', v_buyer_new_balance,
    'seller_net', v_seller_net,
    'platform_fee', v_fee,
    'card_ownership_id', v_ownership_id
  );
END;
$$;
