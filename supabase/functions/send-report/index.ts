
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// Note: In a real app, you would need to integrate with actual email/WhatsApp APIs
// This is a placeholder for demonstration purposes

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendRequest {
  reportId: string;
  method: 'email' | 'whatsapp';
  recipientId: string;
  senderId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      SUPABASE_URL || "",
      SUPABASE_ANON_KEY || ""
    );
    
    const { reportId, method, recipientId, senderId } = await req.json() as SendRequest;

    // Get the report
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    
    if (reportError) {
      throw new Error(`Error fetching report: ${reportError.message}`);
    }

    // Get recipient contact information
    const { data: recipient, error: recipientError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', recipientId)
      .single();
    
    if (recipientError) {
      throw new Error(`Error fetching recipient: ${recipientError.message}`);
    }

    // In a real application, this would call an email API or WhatsApp API
    // For demonstration, we'll just log the attempt and mark the report as sent
    console.log(`Sending report ${reportId} via ${method} to ${recipient.email || recipient.phone || 'unknown recipient'}`);

    // Update the report as sent
    const { error: updateError } = await supabaseClient
      .from('reports')
      .update({ is_sent: true })
      .eq('id', reportId);
    
    if (updateError) {
      throw new Error(`Error updating report status: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Report sent via ${method} to ${recipient.first_name} ${recipient.last_name}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in send-report function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An error occurred processing your send report request" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
