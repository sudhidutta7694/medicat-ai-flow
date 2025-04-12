
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
  
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to database
    await saveMessage(userMessage);
    
    setIsTyping(true);
    
    try {
      // Prepare user context for more personalized responses
      const userContext = {
        medications: medications || [],
        conditions: conditions || [],
        recentEvents: events ? events.slice(0, 5) : []
      };

      // Call our edge function to get AI response
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: messageText,
          userId: user?.id,
          userContext
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const botMessage: ChatMessage = { 
        role: 'bot', 
        content: response.data.content || "I'm sorry, I couldn't process that request."
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Save bot message to database
      await saveMessage(botMessage);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = { 
        role: 'bot', 
        content: "I'm sorry, I encountered an error processing your request. Please try again later." 
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to database
      await saveMessage(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to get response from AI assistant.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
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
    const messageContent = messages.map(msg => 
      `[${msg.role.toUpperCase()}]: ${msg.content}`
    ).join('\n\n');
    
    const subject = "MediFlow AI Chat Transcript";
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageContent)}`;
    
    window.open(mailtoLink);
    
    toast({
      title: "Ready to Share",
      description: "Your email client has been opened with the chat transcript."
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
