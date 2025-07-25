import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    // Verify the webhook signature for security
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature!, "whsec_zvOErMv6qdrBK9038LdpceRkGBkZZF3U");
      logStep("Webhook signature verified");
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err });
      return new Response(`Webhook Error: ${err}`, { status: 400 });
    }
    
    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      logStep("Processing checkout session", { sessionId: session.id });

      // Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("stripe_payment_intent_id", session.payment_intent);

      if (orderError) {
        logStep("Error updating order", orderError);
      }

      // Create MegaOTT subscription
      const megaottResponse = await fetch("https://megaott.net/api/v1/subscriptions", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${Deno.env.get("MEGAOTT_API_TOKEN")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          type: "m3u",
          username: `user_${Date.now()}`, // Generate unique username
          package_id: "4", // Default package - you can change this
          max_connections: "1",
          template_id: "1",
          forced_country: "ALL",
          adult: "false",
          enable_vpn: "true",
          paid: "true",
          note: `Stripe Payment: ${session.id}`,
        }),
      });

      if (!megaottResponse.ok) {
        throw new Error(`MegaOTT API error: ${megaottResponse.status}`);
      }

      const megaottData = await megaottResponse.json();
      logStep("MegaOTT subscription created", { 
        id: megaottData.id, 
        username: megaottData.username 
      });

      // Store subscription details in database
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: session.metadata?.user_id || null,
          stripe_payment_intent_id: session.payment_intent,
          megaott_username: megaottData.username,
          megaott_password: megaottData.password,
          m3u_link: megaottData.dns_link,
          package_name: megaottData.package?.name || "Fixed Package",
          connections_count: megaottData.max_connections,
          status: "active",
          expires_at: megaottData.expiring_at,
        });

      if (subError) {
        logStep("Error storing subscription", subError);
        throw new Error("Failed to store subscription details");
      }

      // Send confirmation email
      try {
        const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-confirmation-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session.customer_details?.email || session.metadata?.email,
            username: megaottData.username,
            password: megaottData.password,
            m3u_link: megaottData.dns_link,
            package_name: megaottData.package?.name || "Fixed Package",
            expires_at: megaottData.expiring_at,
          }),
        });

        if (emailResponse.ok) {
          logStep("Confirmation email sent successfully");
        } else {
          logStep("Failed to send confirmation email", { 
            status: emailResponse.status 
          });
        }
      } catch (emailError) {
        logStep("Email sending error", emailError);
      }

      logStep("Workflow completed successfully");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});