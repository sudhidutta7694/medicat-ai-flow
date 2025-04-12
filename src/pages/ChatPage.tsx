
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, PaperclipIcon, Share, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hello! I'm your MediFlow AI assistant. How can I help you today? I can help assess your symptoms, provide information about medications, or prepare for your doctor's appointment." },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setMessage('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'bot', 
          content: simulateResponse(prev[prev.length - 1].content) 
        }
      ]);
    }, 1500);
  };

  const simulateResponse = (userMessage: string) => {
    // Very simplified simulation of AI responses
    if (userMessage.toLowerCase().includes('headache')) {
      return "I understand you're experiencing headaches. How long have you been experiencing this symptom? Is it constant or intermittent? On a scale of 1-10, how would you rate the pain?";
    } else if (userMessage.toLowerCase().includes('medication') || userMessage.toLowerCase().includes('medicine')) {
      return "To provide accurate information about medications, I'll need more details. What specific medication are you asking about? Are you currently taking any medications?";
    } else if (userMessage.toLowerCase().includes('appointment')) {
      return "I can help prepare information for your doctor's appointment. When is your appointment scheduled? What specific concerns would you like to discuss with your doctor?";
    } else {
      return "Thank you for sharing. Could you provide more details about your symptoms? When did they start? Have you noticed any patterns or triggers?";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const shareTranscript = () => {
    toast({
      title: "Transcript Shared",
      description: "Your chat transcript has been shared with your doctor.",
    });
  };

  // Scroll to bottom whenever messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <MainLayout>
      <div className="mediflow-container py-6 flex flex-col h-[calc(100vh-180px)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Health Assistant</h1>
          <Button variant="outline" size="sm" onClick={shareTranscript}>
            <Share className="h-4 w-4 mr-2" />
            Share with Doctor
          </Button>
        </div>
        
        {/* Chat medical info alert */}
        <div className="medical-info mb-4">
          <h3 className="font-medium">Important Notice</h3>
          <p className="text-sm">
            This AI assistant provides general health information and is not a substitute for professional medical advice. 
            Always consult with your healthcare provider for diagnosis and treatment.
          </p>
        </div>

        {/* Chat messages */}
        <div className="flex-grow overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={cn(
                    "max-w-md rounded-lg p-4",
                    msg.role === 'user' 
                      ? "bg-mediblue-500 text-white rounded-br-none"
                      : "bg-white border border-gray-200 rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none p-4 max-w-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-mediblue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-mediblue-500 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-mediblue-500 rounded-full animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>
        </div>

        {/* Chat input */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline" 
            size="icon"
            type="button"
          >
            <PaperclipIcon className="h-5 w-5 text-gray-500" />
          </Button>
          <Button
            variant="outline" 
            size="icon"
            type="button"
          >
            <Mic className="h-5 w-5 text-gray-500" />
          </Button>
          <div className="flex-grow relative">
            <Input
              className="pr-12"
              placeholder="Type your message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button 
              className="absolute right-1 top-1 bottom-1" 
              size="sm"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
