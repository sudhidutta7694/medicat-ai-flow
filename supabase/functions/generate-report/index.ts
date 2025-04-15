
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY") || "4219e7d7a6bb031daa2be50d0fd41e8e698ec82ca1c8fb1ae1e03e47fb275167";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
    console.log("Processing report generation request");
    
    // Initialize Supabase client with service role key for full access
    const supabaseClient = createClient(
      SUPABASE_URL || "",
      SUPABASE_SERVICE_KEY || ""
    );
    
    const body = await req.json();
    console.log("Request body:", body);
    
    const { appointmentId, transcription, patientNotes, doctorId, patientId } = body as ReportRequest;

    if (!appointmentId || !doctorId || !patientId) {
      throw new Error("Missing required parameters");
    }

    console.log("Fetching patient data");
    // Get patient information
    const { data: patientData, error: patientError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', patientId)
      .single();
    
    if (patientError) {
      console.error("Error fetching patient data:", patientError);
      throw patientError;
    }
    
    console.log("Fetching doctor data");
    // Get doctor information
    const { data: doctorData, error: doctorError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', doctorId)
      .single();
    
    if (doctorError) {
      console.error("Error fetching doctor data:", doctorError);
      throw doctorError;
    }
    
    // Get doctor specialty data
    console.log("Fetching doctor specialty data");
    const { data: doctorSpecialtyData, error: specialtyError } = await supabaseClient
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
    
    if (specialtyError && specialtyError.code !== 'PGRST116') {
      console.error("Error fetching specialty data:", specialtyError);
    }
    
    // Get patient medical context
    console.log("Fetching patient medications");
    const { data: medications, error: medicationsError } = await supabaseClient
      .from('medications')
      .select('*')
      .eq('user_id', patientId);
    
    if (medicationsError) {
      console.error("Error fetching medications:", medicationsError);
    }
    
    console.log("Fetching patient medical conditions");
    const { data: conditions, error: conditionsError } = await supabaseClient
      .from('medical_conditions')
      .select('*')
      .eq('user_id', patientId);
    
    if (conditionsError) {
      console.error("Error fetching conditions:", conditionsError);
    }

    console.log("Fetching patient allergies");
    const { data: allergies, error: allergiesError } = await supabaseClient
      .from('allergies')
      .select('*')
      .eq('user_id', patientId);
    
    if (allergiesError) {
      console.error("Error fetching allergies:", allergiesError);
    }

    // Generate visit summary from transcription using Together AI
    const doctorName = doctorData 
      ? `Dr. ${doctorData.first_name || ''} ${doctorData.last_name || ''}` 
      : 'Unknown Doctor';
    
    const doctorSpecialty = doctorSpecialtyData?.specialty || 'General Medicine';
    
    console.log("Generating visit summary");
    const visitSummaryPrompt = `
You are an AI medical scribe assisting a doctor. Based on the following consultation transcription and patient notes, create a concise, professional visit summary in the SOAP format (Subjective, Objective, Assessment, Plan). Include only medically relevant information.

Patient Information:
- Name: ${patientData?.first_name || ''} ${patientData?.last_name || ''}
- Known Conditions: ${conditions?.map(c => c.name).join(', ') || 'None reported'}
- Current Medications: ${medications?.map(m => m.name).join(', ') || 'None reported'}
- Allergies: ${allergies?.map(a => a.name).join(', ') || 'None reported'}

Doctor:
- Name: ${doctorName}
- Specialty: ${doctorSpecialty}

Patient Notes: ${patientNotes || 'None provided'}

Consultation Transcription:
${transcription || 'No transcription provided'}

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
      console.error("Visit summary API error:", await visitSummaryResponse.text());
      throw new Error(`Error generating visit summary: API responded with ${visitSummaryResponse.status}`);
    }

    const visitSummaryData = await visitSummaryResponse.json();
    const visitSummary = visitSummaryData.choices[0].message.content;
    console.log("Visit summary generated");

    // Generate prescription recommendation
    console.log("Generating prescription recommendation");
    const prescriptionPrompt = `
Based on the visit summary and patient information below, suggest potential prescription options (if appropriate). If no medication is needed, clearly state that. Be specific about dosage, frequency, and duration when suggesting medications.

Patient Information:
- Name: ${patientData?.first_name || ''} ${patientData?.last_name || ''}
- Known Conditions: ${conditions?.map(c => c.name).join(', ') || 'None reported'}
- Current Medications: ${medications?.map(m => m.name).join(', ') || 'None reported'}
- Allergies: ${allergies?.map(a => a.name).join(', ') || 'None reported'}

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
      console.error("Prescription API error:", await prescriptionResponse.text());
      throw new Error(`Error generating prescription: API responded with ${prescriptionResponse.status}`);
    }

    const prescriptionData = await prescriptionResponse.json();
    const prescription = prescriptionData.choices[0].message.content;
    console.log("Prescription recommendation generated");

    // Create a complete report
    const title = `Visit Report: ${patientData?.first_name || ''} ${patientData?.last_name || ''} - ${new Date().toLocaleDateString()}`;
    const content = `
# Medical Visit Report

**Date:** ${new Date().toLocaleDateString()}
**Patient:** ${patientData?.first_name || ''} ${patientData?.last_name || ''}
**Doctor:** ${doctorName} (${doctorSpecialty})

## Summary
${visitSummary}

## Notes
This report was generated based on doctor-patient consultation. The information contained should be reviewed by the healthcare provider for accuracy.
`;

    // Insert the report into the database
    console.log("Saving report to database");
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
      console.error("Error saving report to database:", error);
      throw error;
    }

    console.log("Report generated successfully:", report.id);
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
