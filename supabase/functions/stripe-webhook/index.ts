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
    
    logStep("Event type received", { type: event.type });

    // Handle both checkout.session.completed and payment_intent.succeeded for testing
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
      logStep("Starting email sending process");
      
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        logStep("DEBUG: Resend API Key check", { 
          hasApiKey: !!resendApiKey,
          keyLength: resendApiKey?.length || 0,
          keyPrefix: resendApiKey ? resendApiKey.substring(0, 8) + "..." : "none"
        });

        if (!resendApiKey) {
          throw new Error("RESEND_API_KEY environment variable is not set");
        }

        const resend = new Resend(resendApiKey);
        const recipientEmail = session.customer_details?.email || session.metadata?.email;
        
        // TEMPORARY: Hardcoded test email
        const testEmail = "trav.singletary@gmail.com";
        
        logStep("DEBUG: Email details before send", {
          originalRecipient: recipientEmail,
          testRecipient: testEmail,
          username: megaottData.username,
          password: megaottData.password?.substring(0, 4) + "..." || "none",
          dnsLink: megaottData.dns_link,
          portalLink: megaottData.portal_link,
          hasAllData: !!(megaottData.username && megaottData.password && megaottData.dns_link)
        });

        const emailData = {
          from: "onboarding@resend.dev", // Using verified Resend domain
          to: [testEmail], // TEMPORARY: Using hardcoded test email
          subject: "TEST: Your IPTV Subscription is Ready!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">TEST EMAIL - Your IPTV Subscription is Active!</h1>
              
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
                This is a TEST EMAIL to debug Resend integration.<br>
                Session ID: ${session.id}
              </p>
            </div>
          `,
        };

        logStep("DEBUG: About to call Resend API", { emailData: { 
          from: emailData.from, 
          to: emailData.to, 
          subject: emailData.subject,
          htmlLength: emailData.html.length 
        }});

        const emailResponse = await resend.emails.send(emailData);

        logStep("DEBUG: Resend API call completed", { 
          success: !!emailResponse.data,
          hasError: !!emailResponse.error,
          responseKeys: Object.keys(emailResponse)
        });

        // Log the full response regardless of success/error
        logStep("DEBUG: Full Resend API response", { 
          fullResponse: emailResponse,
          data: emailResponse.data,
          error: emailResponse.error
        });

        if (emailResponse.error) {
          logStep("Resend API error details", {
            error: emailResponse.error,
            errorMessage: emailResponse.error?.message,
            errorName: emailResponse.error?.name
          });
          throw new Error(`Resend error: ${JSON.stringify(emailResponse.error)}`);
        } else {
          logStep("Confirmation email sent successfully", { 
            messageId: emailResponse.data?.id,
            recipient: testEmail,
            success: true
          });
        }
      } catch (emailError) {
        logStep("Email sending error caught", { 
          error: emailError,
          message: emailError instanceof Error ? emailError.message : String(emailError),
          stack: emailError instanceof Error ? emailError.stack : undefined
        });
        // Don't throw error - subscription is still created successfully
      }

      logStep("Email sending process completed");
    } else if (event.type === "payment_intent.succeeded") {
      // Handle payment_intent.succeeded for testing
      logStep("Processing payment_intent.succeeded event for testing");
      
      const paymentIntent = event.data.object;
      logStep("Payment intent details", { 
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status
      });

      // For testing purposes, create a mock IPTV subscription
      const mockCredentials = {
        username: `test_user_${Date.now()}`,
        password: `test_pass_${Math.random().toString(36).substr(2, 8)}`,
        dns_link: "http://test.megaott.net/playlist.m3u8",
        portal_link: "http://test.megaott.net/portal"
      };

      logStep("Mock credentials created for testing", mockCredentials);

      // Send test email
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        logStep("DEBUG: Resend API Key check for payment_intent test", { 
          hasApiKey: !!resendApiKey,
          keyLength: resendApiKey?.length || 0,
          keyPrefix: resendApiKey ? resendApiKey.substring(0, 8) + "..." : "none"
        });

        if (!resendApiKey) {
          throw new Error("RESEND_API_KEY environment variable is not set");
        }

        const resend = new Resend(resendApiKey);
        const testEmail = "trav.singletary@gmail.com";
        
        logStep("DEBUG: About to send test email for payment_intent", {
          recipient: testEmail,
          credentials: mockCredentials
        });

        const emailResponse = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: [testEmail],
          subject: "TEST: Payment Intent Succeeded - IPTV Test",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">TEST: Payment Intent Succeeded</h1>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #495057; margin-top: 0;">Test IPTV Credentials:</h2>
                <p><strong>Username:</strong> ${mockCredentials.username}</p>
                <p><strong>Password:</strong> ${mockCredentials.password}</p>
                <p><strong>M3U Link:</strong> ${mockCredentials.dns_link}</p>
                <p><strong>Portal Link:</strong> ${mockCredentials.portal_link}</p>
              </div>

              <p style="text-align: center; color: #666; margin-top: 30px;">
                This is a TEST EMAIL for payment_intent.succeeded event.<br>
                Payment Intent ID: ${paymentIntent.id}
              </p>
            </div>
          `,
        });

        logStep("DEBUG: Resend API response for payment_intent test", { 
          success: !!emailResponse.data,
          messageId: emailResponse.data?.id,
          error: emailResponse.error,
          fullResponse: emailResponse
        });

        if (emailResponse.error) {
          logStep("Resend API error in payment_intent test", emailResponse.error);
        } else {
          logStep("Test email sent successfully for payment_intent", { 
            messageId: emailResponse.data?.id,
            recipient: testEmail
          });
        }
      } catch (emailError) {
        logStep("Email sending error in payment_intent test", { 
          error: emailError,
          message: emailError instanceof Error ? emailError.message : String(emailError)
        });
      }

      logStep("Payment intent test processing completed");
    } else {
      logStep("Unhandled event type", { type: event.type });
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