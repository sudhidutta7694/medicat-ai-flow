
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY") || "4219e7d7a6bb031daa2be50d0fd41e8e698ec82ca1c8fb1ae1e03e47fb275167";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  appointmentId: string;
  transcription: string;
  patientNotes: string;
  doctorId: string;
  patientId: string;
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
    
    const { appointmentId, transcription, patientNotes, doctorId, patientId } = await req.json() as ReportRequest;

    // Get patient and doctor information
    const { data: patientData } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();
    
    const { data: doctorData } = await supabaseClient
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
    
    // Get patient medical context
    const { data: medications } = await supabaseClient
      .from('medications')
      .select('*')
      .eq('user_id', patientId);
    
    const { data: conditions } = await supabaseClient
      .from('medical_conditions')
      .select('*')
      .eq('user_id', patientId);

    // Generate visit summary from transcription using Together AI
    const visitSummaryPrompt = `
You are an AI medical scribe assisting a doctor. Based on the following consultation transcription and patient notes, create a concise, professional visit summary in the SOAP format (Subjective, Objective, Assessment, Plan). Include only medically relevant information.

Patient Information:
- Name: ${patientData?.first_name || ''} ${patientData?.last_name || ''}
- Known Conditions: ${conditions?.map(c => c.name).join(', ') || 'None reported'}
- Current Medications: ${medications?.map(m => m.name).join(', ') || 'None reported'}

Patient Notes: ${patientNotes}

Consultation Transcription:
${transcription}

Format your response as a medical visit summary.
`;

    const visitSummaryResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          { role: "system", content: "You are an AI medical scribe that creates concise visit summaries in SOAP format." },
          { role: "user", content: visitSummaryPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    });

    if (!visitSummaryResponse.ok) {
      throw new Error(`Error generating visit summary: ${await visitSummaryResponse.text()}`);
    }

    const visitSummaryData = await visitSummaryResponse.json();
    const visitSummary = visitSummaryData.choices[0].message.content;

    // Generate prescription recommendation
    const prescriptionPrompt = `
Based on the visit summary and patient information below, suggest potential prescription options (if appropriate). If no medication is needed, clearly state that. Be specific about dosage, frequency, and duration when suggesting medications.

Patient Information:
- Name: ${patientData?.first_name || ''} ${patientData?.last_name || ''}
- Known Conditions: ${conditions?.map(c => c.name).join(', ') || 'None reported'}
- Current Medications: ${medications?.map(m => m.name).join(', ') || 'None reported'}

Visit Summary:
${visitSummary}

Provide prescription recommendations in a structured format.
`;

    const prescriptionResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          { role: "system", content: "You are an AI medical assistant helping to suggest possible prescription options. You always emphasize that the doctor must review and approve any medication suggestions." },
          { role: "user", content: prescriptionPrompt }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    if (!prescriptionResponse.ok) {
      throw new Error(`Error generating prescription: ${await prescriptionResponse.text()}`);
    }

    const prescriptionData = await prescriptionResponse.json();
    const prescription = prescriptionData.choices[0].message.content;

    // Create a complete report
    const title = `Visit Report: ${patientData?.first_name || ''} ${patientData?.last_name || ''} - ${new Date().toLocaleDateString()}`;
    const content = `
# Medical Visit Report

**Date:** ${new Date().toLocaleDateString()}
**Patient:** ${patientData?.first_name || ''} ${patientData?.last_name || ''}
**Doctor:** Dr. ${doctorData?.specialty || 'Specialist'}

## Summary
${visitSummary}

## Notes
This report was generated based on doctor-patient consultation. The information contained should be reviewed by the healthcare provider for accuracy.
`;

    // Insert the report into the database
    const { data: report, error } = await supabaseClient
      .from('reports')
      .insert({
        appointment_id: appointmentId,
        doctor_id: doctorId,
        patient_id: patientId,
        title,
        content,
        prescription,
        visit_summary: visitSummary,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: report.id,
        title: report.title,
        content: report.content,
        prescription: report.prescription,
        visit_summary: report.visit_summary
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in generate-report function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An error occurred processing your report generation request" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
