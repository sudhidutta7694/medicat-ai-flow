
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useTimeline } from '@/hooks/use-timeline';
import { useMedications } from '@/hooks/use-medications';
import { useMedicalConditions } from '@/hooks/use-medical-conditions';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'bot';
  content: string;
  timestamp?: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'bot', 
      content: "Hello! I'm your MediFlow AI assistant. How can I help you today? I can help assess your symptoms, provide information about medications, or prepare for your doctor's appointment." 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { events } = useTimeline();
  const { medications } = useMedications();
  const { conditions } = useMedicalConditions();
  
  // Create or get current chat session
  useEffect(() => {
    const createSession = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert([{ user_id: user.id, title: `Chat ${new Date().toLocaleDateString()}` }])
          .select()
          .single();
          
        if (error) throw error;
        setSessionId(data.id);
      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    };

    if (user && !sessionId) {
      createSession();
    }
  }, [user, sessionId]);
  
  // Save message to database
  const saveMessage = async (message: ChatMessage) => {
    if (!user || !sessionId) return;
    
    try {
      await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: sessionId,
            role: message.role,
            content: message.content
          }
        ]);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };
  
  const processUserQuery = (userMessage: string): string => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Check for medication-related queries
    if (lowercaseMessage.includes('medication') || lowercaseMessage.includes('medicine') || lowercaseMessage.includes('prescriptions')) {
      if (medications && medications.length > 0) {
        const activeMeds = medications.filter(med => med.is_active).map(med => 
          `${med.name} (${med.dosage || 'no dosage specified'}, ${med.frequency || 'no frequency specified'})`
        ).join(', ');
        
        return `Based on your records, you're currently taking: ${activeMeds}. Always follow your doctor's instructions regarding medications.`;
      } else {
        return "I don't see any medications in your records. Would you like to add them in the Medications section?";
      }
    }
    
    // Check for medical conditions
    if (lowercaseMessage.includes('condition') || lowercaseMessage.includes('diagnosis') || lowercaseMessage.includes('medical history')) {
      if (conditions && conditions.length > 0) {
        const activeConditions = conditions.filter(c => c.is_active).map(c => c.name).join(', ');
        
        return `According to your records, you have the following medical conditions: ${activeConditions}. If you need to discuss these conditions further, please consult your healthcare provider.`;
      } else {
        return "I don't see any medical conditions in your records. You can add them in the Medical Conditions section.";
      }
    }
    
    // Check for appointment or visit-related queries
    if (lowercaseMessage.includes('appointment') || lowercaseMessage.includes('visit') || lowercaseMessage.includes('doctor')) {
      const doctorVisits = events ? events.filter(event => event.type === 'visit') : [];
      
      if (doctorVisits.length > 0) {
        const latestVisit = doctorVisits[0]; // Assuming events are sorted by date
        return `Your last doctor's visit was on ${new Date(latestVisit.date).toLocaleDateString()} regarding "${latestVisit.title}". Would you like to schedule a follow-up appointment?`;
      } else {
        return "I don't see any recent doctor visits in your records. Would you like information on how to schedule an appointment?";
      }
    }
    
    // Check for timeline or history-related queries
    if (lowercaseMessage.includes('timeline') || lowercaseMessage.includes('history') || lowercaseMessage.includes('events')) {
      if (events && events.length > 0) {
        const recentEvents = events.slice(0, 3).map(e => 
          `${new Date(e.date).toLocaleDateString()}: ${e.title} (${e.type})`
        ).join('\n- ');
        
        return `Here are your recent medical events:\n- ${recentEvents}\n\nYou can view your full timeline in the Medical Timeline section.`;
      } else {
        return "Your medical timeline is empty. You can add events like doctor visits, lab results, and prescriptions in the Timeline section.";
      }
    }
    
    // General health advice (fallback)
    if (lowercaseMessage.includes('headache')) {
      return "I understand you're experiencing headaches. How long have you been experiencing this symptom? Is it constant or intermittent? On a scale of 1-10, how would you rate the pain?";
    } else if (lowercaseMessage.includes('symptom')) {
      return "Thank you for sharing. Could you provide more details about your symptoms? When did they start? Have you noticed any patterns or triggers?";
    } else if (lowercaseMessage.includes('prevention') || lowercaseMessage.includes('healthy')) {
      return "Maintaining good health involves regular exercise, a balanced diet, adequate sleep, stress management, and regular check-ups. Would you like specific information about any of these areas?";
    } else {
      return "Thank you for your question. To provide accurate information, I'd need more details. Could you be more specific about what health information you're looking for?";
    }
  };
  
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to database
    await saveMessage(userMessage);
    
    setIsTyping(true);
    
    // Process the user's message
    setTimeout(async () => {
      const botResponse = processUserQuery(messageText);
      const botMessage: ChatMessage = { role: 'bot', content: botResponse };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Save bot message to database
      await saveMessage(botMessage);
    }, 1000);
  };
  
  const exportChat = () => {
    const chatText = messages.map(msg => 
      `[${msg.role.toUpperCase()}]: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediFlow_Chat_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Chat Exported",
      description: "Your chat transcript has been downloaded."
    });
  };
  
  const shareWithDoctor = () => {
    // In a real application, this would integrate with email or patient portal
    toast({
      title: "Transcript Shared",
      description: "Your chat transcript has been shared with your doctor."
    });
  };
  
  return { 
    messages, 
    isTyping, 
    sendMessage,
    exportChat,
    shareWithDoctor 
  };
};
