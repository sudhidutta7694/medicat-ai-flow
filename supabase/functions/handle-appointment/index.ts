
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

    // We only care about appointment status changes
    if (type !== 'UPDATE') {
      return new Response(
        JSON.stringify({ message: 'No action needed for non-update events' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing appointment update:', record)

    // Fetch more details about the appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id (
          id,
          specialty,
          profiles:id (
            first_name,
            last_name
          )
        ),
        patient:patient_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', record.id)
      .single()

    if (appointmentError) {
      throw new Error(`Error fetching appointment details: ${appointmentError.message}`)
    }

    if (!appointment) {
      throw new Error(`Appointment not found with ID: ${record.id}`)
    }

    console.log('Fetched appointment details:', appointment)

    const appointmentDate = new Date(appointment.scheduled_at)
    const doctorFirstName = appointment.doctor?.profiles?.first_name || 'Unknown'
    const doctorLastName = appointment.doctor?.profiles?.last_name || 'Unknown'
    const doctorSpecialty = appointment.doctor?.specialty || 'General Medicine'

    // Check if there's a report for this appointment
    let reportId = null;
    if (record.status === 'confirmed') {
      const { data: reportData } = await supabase
        .from('reports')
        .select('id')
        .eq('appointment_id', record.id)
        .maybeSingle();
        
      if (reportData) {
        reportId = reportData.id;
      }
    }

    // If appointment is confirmed, create a medical event in the patient's timeline
    if (record.status === 'confirmed') {
      console.log('Adding confirmed appointment to timeline')

      const { error: timelineError } = await supabase
        .from('medical_events')
        .insert([
          {
            user_id: appointment.patient_id,
            date: appointmentDate.toISOString(),
            title: `Appointment with Dr. ${doctorFirstName} ${doctorLastName}`,
            description: `Confirmed appointment with ${doctorSpecialty} specialist. Issue: ${appointment.issue || 'Not specified'}`,
            type: 'appointment',
            report_id: reportId,
          },
        ])

      if (timelineError) {
        throw new Error(`Error creating timeline event: ${timelineError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Appointment ${record.status} and processed successfully`, 
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
