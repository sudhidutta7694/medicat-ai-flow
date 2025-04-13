
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY") || "4219e7d7a6bb031daa2be50d0fd41e8e698ec82ca1c8fb1ae1e03e47fb275167";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  userId: string | undefined;
  userContext?: {
    medications?: any[];
    conditions?: any[];
    recentEvents?: any[];
  };
  doctorMode?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, userContext, doctorMode } = await req.json() as ChatRequest;

    // Prepare system prompt based on available user data
    let systemPrompt = `You are MediFlow, an advanced medical AI assistant designed to help patients and healthcare providers.
Your role is to provide helpful medical information, symptom assessment, and clinical guidance.
Always clarify you're not a replacement for professional medical advice.

When asked about symptoms:
1. Ask clarifying questions about duration, severity, and context
2. Provide reasoned suggestions about possible causes (preclinical targeted diagnosis)
3. Recommend when to seek professional care
4. Be empathetic and clear in your responses

${doctorMode ? `You are in DOCTOR MODE. You should provide more detailed clinical information and reasoning, using medical terminology as appropriate. Help the doctor create custom chatbot experiences for their patients.` : `You are in PATIENT MODE. Use simple language and focus on providing clear, actionable guidance for the patient.`}

Today's date is ${new Date().toLocaleDateString()}.`;

    // Add user-specific context if available
    if (userContext) {
      let contextPrompt = "\n\nUser context:";
      
      if (userContext.medications && userContext.medications.length > 0) {
        contextPrompt += "\nMedications: " + userContext.medications.map((med: any) => 
          `${med.name} (${med.dosage || 'no dosage'}, ${med.frequency || 'no frequency'})`
        ).join(", ");
      }
      
      if (userContext.conditions && userContext.conditions.length > 0) {
        contextPrompt += "\nMedical conditions: " + userContext.conditions.map((cond: any) => 
          cond.name
        ).join(", ");
      }
      
      if (userContext.recentEvents && userContext.recentEvents.length > 0) {
        contextPrompt += "\nRecent medical events: " + userContext.recentEvents.map((event: any) => 
          `${event.title} (${event.type}, ${new Date(event.date).toLocaleDateString()})`
        ).join("; ");
      }
      
      systemPrompt += contextPrompt;
    }

    console.log("System prompt:", systemPrompt);
    console.log("User message:", message);

    // Call the Together AI API
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Together AI API error:", error);
      throw new Error(`Together AI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    return new Response(JSON.stringify({
      content: data.choices[0].message.content
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error in AI chat function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An error occurred processing your request" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
