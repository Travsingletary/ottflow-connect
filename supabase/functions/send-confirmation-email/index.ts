import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { 
      email, 
      username, 
      password, 
      m3u_link, 
      package_name, 
      expires_at 
    } = await req.json();

    logStep("Sending confirmation email", { email, username });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center;">🎉 Your IPTV Subscription is Ready!</h1>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-top: 0;">Subscription Details</h2>
          <p><strong>Package:</strong> ${package_name}</p>
          <p><strong>Username:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${username}</code></p>
          <p><strong>Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          <p><strong>Expires:</strong> ${new Date(expires_at).toLocaleDateString()}</p>
        </div>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #065f46; margin-top: 0;">📺 Your M3U Playlist Link</h3>
          <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-family: monospace;">
            <a href="${m3u_link}" style="color: #059669;">${m3u_link}</a>
          </p>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">📱 How to Get Started</h3>
          <ol style="color: #78350f;">
            <li>Download your preferred IPTV app (VLC, Perfect Player, TiviMate, etc.)</li>
            <li>Add the M3U playlist URL above to your app</li>
            <li>Use your username and password when prompted</li>
            <li>Enjoy your premium IPTV experience!</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f1f5f9; border-radius: 8px;">
          <p style="color: #475569; margin: 0;">
            Questions? Need help? Contact our support team for assistance.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Thank you for choosing our IPTV service!
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "IPTV Service <onboarding@resend.dev>",
      to: [email],
      subject: "🎉 Your IPTV Subscription Credentials",
      html: emailContent,
    });

    logStep("Email sent successfully", { messageId: emailResponse.data?.id });

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-confirmation-email", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});