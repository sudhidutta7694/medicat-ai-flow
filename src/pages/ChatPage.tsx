
import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, PaperclipIcon, Share, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/use-chat';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isTyping, sendMessage, exportChat, shareWithDoctor } = useChat();

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <MainLayout>
      <div className="mediflow-container py-6 flex flex-col h-[calc(100vh-180px)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Health Assistant</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shareWithDoctor}>
              <Share className="h-4 w-4 mr-2" />
              Share with Doctor
            </Button>
            <Button variant="outline" size="sm" onClick={exportChat}>
              <Download className="h-4 w-4 mr-2" />
              Export Chat
            </Button>
          </div>
        </div>
        
        {/* Chat medical info alert */}
        <div className="medical-info mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
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
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
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
