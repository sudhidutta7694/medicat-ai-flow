
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

    const { record, type } = await req.json()

    // We only care about appointment status changes to "confirmed"
    if (type !== 'UPDATE' || record.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ message: 'No action needed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing confirmed appointment:', record)

    // Fetch more details about the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id (
          specialty,
          profiles:id (
            first_name,
            last_name
          )
        )
      `)
      .eq('id', record.id)
      .single()

    if (appointmentError) {
      throw new Error(`Error fetching appointment details: ${appointmentError.message}`)
    }

    // Create a medical event in the patient's timeline
    const appointmentDate = new Date(appointment.scheduled_at)
    const doctorFirstName = appointment.doctor?.profiles?.first_name || 'Unknown'
    const doctorLastName = appointment.doctor?.profiles?.last_name || ''
    const doctorSpecialty = appointment.doctor?.specialty || 'Unknown'

    const { error: timelineError } = await supabase
      .from('medical_events')
      .insert([
        {
          user_id: appointment.patient_id,
          date: appointmentDate.toISOString(),
          title: `Appointment with Dr. ${doctorFirstName} ${doctorLastName}`,
          description: `Confirmed appointment with ${doctorSpecialty} specialist. Issue: ${appointment.issue || 'Not specified'}`,
          type: 'visit',
        },
      ])

    if (timelineError) {
      throw new Error(`Error creating timeline event: ${timelineError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Appointment confirmed and added to patient timeline', 
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing appointment:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
