-- Make stripe_payment_intent_id nullable since checkout sessions may not have payment intents initially
ALTER TABLE public.orders 
ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;