import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload));

    const record = payload.record;
    if (!record || !record.order_id) {
      throw new Error("Invalid payload: missing record or order_id");
    }

    const orderId = record.order_id;
    const deliveryId = record.id;

    // Initialize Supabase Client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch Order and related details (Customer details, Service, Plan)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        order_number,
        customer_name,
        customer_email,
        services (name),
        service_plans (name)
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to fetch order details: ${orderError?.message || "Order not found"}`);
    }

    const customerName = order.customer_name;
    const customerEmail = order.customer_email;
    const orderNumber = order.order_number;
    const serviceName = order.services?.name || "خدمة رقمية";
    const planName = order.service_plans?.name || "باقة";

    // 2. Fetch the subscription_delivered email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("subject, body")
      .eq("key", "subscription_delivered")
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      throw new Error(`Failed to fetch email template: ${templateError?.message || "Template not found"}`);
    }

    // 3. Populate variables in subject and body
    let subject = template.subject;
    let body = template.body;

    const replacements: Record<string, string> = {
      "{customer_name}": customerName,
      "{order_number}": orderNumber,
      "{service_name}": serviceName,
      "{plan_name}": planName,
    };

    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replaceAll(key, value);
      body = body.replaceAll(key, value);
    }

    // Convert newlines in body to HTML paragraphs/brs for the email client
    const htmlBody = body.replace(/\n/g, "<br>");

    // 4. Send email via Resend API
    console.log(`Sending email to ${customerEmail}...`);
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Saifrow Store <noreply@saifrow.store>",
        to: [customerEmail],
        subject: subject,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: right; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; padding: 24px; background-color: #fafafa;">
            <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #3b82f6; margin: 0;">Saifrow Store</h2>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${htmlBody}
            </div>
            <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #eaeaea; font-size: 11px; color: #9ca3af; text-align: center;">
              هذه رسالة تلقائية، يرجى عدم الرد عليها مباشرة.
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API Error:", emailResult);
      
      // Log error in database
      await supabase.from("email_logs").insert({
        order_id: orderId,
        recipient_email: customerEmail,
        subject: subject,
        status: "failed",
        error_message: emailResult.message || "Failed to send via Resend API",
      });

      throw new Error(`Email sending failed: ${emailResult.message || "Unknown error"}`);
    }

    console.log("Email sent successfully! ID:", emailResult.id);

    // 5. Insert success log in email_logs
    await supabase.from("email_logs").insert({
      order_id: orderId,
      recipient_email: customerEmail,
      subject: subject,
      status: "sent",
    });

    // 6. Update delivery_details to confirm email sent
    await supabase
      .from("delivery_details")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", deliveryId);

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: any) {
    console.error("Error in serve function:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
