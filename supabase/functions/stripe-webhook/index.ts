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

// Function to send SMS notification via Twilio
const sendSMSNotification = async (orderDetails: any) => {
  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const businessPhoneNumber = Deno.env.get("BUSINESS_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber || !businessPhoneNumber) {
      logStep("SMS skipped - missing Twilio configuration");
      return;
    }

    const message = `🎉 NEW IPTV PURCHASE!
Customer: ${orderDetails.customerEmail}
Amount: $${orderDetails.amount}
Order ID: ${orderDetails.orderId}
Time: ${new Date().toLocaleString()}

Please send IPTV credentials manually.`;

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: businessPhoneNumber,
        Body: message,
      }),
    });

    if (response.ok) {
      logStep("SMS notification sent successfully");
    } else {
      logStep("SMS notification failed", { status: response.status });
    }
  } catch (error) {
    logStep("SMS notification error", { error: error.message });
  }
};

// Function to send email notification to business owner
const sendBusinessNotification = async (orderDetails: any) => {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const businessEmail = Deno.env.get("BUSINESS_EMAIL") || "trav.singletary@gmail.com";

    if (!resendApiKey) {
      logStep("Email notification skipped - missing Resend API key");
      return;
    }

    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: "notifications@resend.dev",
      to: [businessEmail],
      subject: "🎉 New IPTV Purchase - Manual Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px;">
            New IPTV Purchase!
          </h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #495057; margin-top: 0;">Order Details:</h2>
            <p><strong>Customer Email:</strong> ${orderDetails.customerEmail}</p>
            <p><strong>Amount:</strong> $${orderDetails.amount}</p>
            <p><strong>Payment ID:</strong> ${orderDetails.paymentIntentId}</p>
            <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
            <p><strong>Purchase Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">⚠️ Action Required</h3>
            <p style="color: #856404; margin-bottom: 0;">Please manually send IPTV credentials to the customer at: <strong>${orderDetails.customerEmail}</strong></p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">This is an automated notification from your IPTV service.</p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      logStep("Business email notification failed", emailResponse.error);
    } else {
      logStep("Business email notification sent successfully", { 
        messageId: emailResponse.data?.id,
        recipient: businessEmail
      });
    }
  } catch (error) {
    logStep("Business email notification error", { error: error.message });
  }
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

      // Prepare order details for notifications
      const orderDetails = {
        customerEmail: session.customer_details?.email || session.metadata?.email || "Unknown",
        amount: (session.amount_total / 100).toFixed(2),
        paymentIntentId: session.payment_intent,
        orderId: session.id,
      };

      logStep("Sending business notifications", orderDetails);

      // Send business notifications (email and SMS)
      await Promise.all([
        sendBusinessNotification(orderDetails),
        sendSMSNotification(orderDetails)
      ]);

      // Send customer confirmation email with credentials
      logStep("Sending customer confirmation email", { email: orderDetails.customerEmail });
      try {
        const confirmationResponse = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: orderDetails.customerEmail,
            username: `user_${Date.now()}`,
            password: Math.random().toString(36).substring(2, 15),
            m3u_link: `http://buddy-iptv.com/get.php?username=user_${Date.now()}&password=${Math.random().toString(36).substring(2, 15)}&type=m3u_plus&output=ts`,
            package_name: "IPTV Subscription",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          }
        });
        
        if (confirmationResponse.error) {
          logStep("Error sending confirmation email", confirmationResponse.error);
        } else {
          logStep("Confirmation email sent successfully");
        }
      } catch (emailError) {
        logStep("Failed to send confirmation email", emailError);
      }

      logStep("Order processing completed");
      
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