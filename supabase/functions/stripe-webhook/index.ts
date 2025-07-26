import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { Resend } from "npm:resend@2.0.0";

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
    logStep("Webhook received", { 
      method: req.method, 
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });
    
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
      const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "whsec_zvOErMv6qdrBK9038LdpceRkGBkZZF3U";
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
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

      // Create MegaOTT subscription with hardcoded package ID and 1 connection
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
          package_id: "4", // Hardcoded package ID
          max_connections: "1", // Hardcoded to 1 connection
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
          username: megaottData.username,
          password: megaottData.password,
          dns_link: megaottData.dns_link,
          portal_link: megaottData.portal_link || null,
          max_connections: 1, // Hardcoded to 1 connection
          whatsapp: session.metadata?.whatsapp || null,
          status: "active",
          expires_at: megaottData.expiring_at,
        });

      if (subError) {
        logStep("Error storing subscription", subError);
        throw new Error("Failed to store subscription details");
      }

      // Send confirmation email with IPTV credentials
      try {
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
        const recipientEmail = session.customer_details?.email || session.metadata?.email;
        
        if (!recipientEmail) {
          logStep("No email address found in session");
          throw new Error("No email address found");
        }

        logStep("Sending confirmation email", { email: recipientEmail });

        const emailResponse = await resend.emails.send({
          from: "IPTV Service <onboarding@resend.dev>",
          to: [recipientEmail],
          subject: "Your IPTV Subscription is Ready!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">Your IPTV Subscription is Active!</h1>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #495057; margin-top: 0;">Login Credentials:</h2>
                <p><strong>Username:</strong> ${megaottData.username}</p>
                <p><strong>Password:</strong> ${megaottData.password}</p>
              </div>

              <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #1976d2; margin-top: 0;">Access Links:</h2>
                <p><strong>M3U Playlist:</strong><br>
                <a href="${megaottData.dns_link}" style="color: #1976d2; word-break: break-all;">${megaottData.dns_link}</a></p>
                
                ${megaottData.portal_link ? `
                <p><strong>Portal Link:</strong><br>
                <a href="${megaottData.portal_link}" style="color: #1976d2; word-break: break-all;">${megaottData.portal_link}</a></p>
                ` : ''}
              </div>

              <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">Getting Started:</h3>
                <ol style="color: #856404;">
                  <li>Download an IPTV player app (VLC, IPTV Smarters, etc.)</li>
                  <li>Use the M3U link above to load your channels</li>
                  <li>Use your username and password when prompted</li>
                  <li>Enjoy your premium IPTV experience!</li>
                </ol>
              </div>

              <p style="text-align: center; color: #666; margin-top: 30px;">
                If you have any questions, please don't hesitate to contact our support team.
              </p>
            </div>
          `,
        });

        logStep("Confirmation email sent successfully", { 
          messageId: emailResponse.data?.id 
        });
      } catch (emailError) {
        logStep("Email sending error", emailError);
        // Don't throw error - subscription is still created successfully
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