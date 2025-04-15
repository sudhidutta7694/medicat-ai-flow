
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.22.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create database function for appointment webhooks
    const { error: funcError } = await supabase.rpc('create_appointment_webhook_function')
    
    if (funcError) {
      throw new Error(`Failed to create database function: ${funcError.message}`)
    }
    
    // Create database trigger to call webhook when appointment status changes
    const { error: triggerError } = await supabase.rpc('create_appointment_webhook_trigger')
    
    if (triggerError) {
      throw new Error(`Failed to create database trigger: ${triggerError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database function and trigger created successfully.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating database trigger:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
