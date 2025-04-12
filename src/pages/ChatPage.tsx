
import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, PaperclipIcon, Share, Download, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useChat } from '@/hooks/use-chat';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Common medical question suggestions
const QUESTION_SUGGESTIONS = [
  "What are common symptoms of the flu?",
  "How can I manage my diabetes better?",
  "What medications help with migraines?",
  "Should I be concerned about this persistent cough?",
  "What are the side effects of my current medications?",
  "How often should I check my blood pressure?",
  "Can you explain my latest lab results?",
  "What questions should I ask my doctor at my next appointment?"
];

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isTyping, sendMessage, exportChat, shareWithDoctor } = useChat();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  };

  const handleStartRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }
    
    // This is a simplified version - in a real app, you'd need to handle browser compatibility better
    // @ts-ignore - SpeechRecognition isn't in TypeScript's lib.dom.d.ts yet
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + ' ' + transcript);
      
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current!.style.height = 'auto';
          textareaRef.current!.style.height = `${textareaRef.current!.scrollHeight}px`;
        }, 0);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      toast({
        title: "Speech Recognition Error",
        description: `Error: ${event.error}`,
        variant: "destructive"
      });
    };
    
    recognition.start();
    
    toast({
      title: "Listening...",
      description: "Speak now. Recognition will automatically stop after you pause."
    });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format message content with markdown-like syntax
  const formatMessage = (content: string) => {
    // Replace **text** with bold
    const boldText = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace * or - lists with proper HTML lists
    const withLists = boldText.replace(
      /(\n\s*(\*|\-)\s.*)+/g, 
      match => `<ul>${match.replace(/\n\s*(\*|\-)\s(.*)/g, '<li>$2</li>')}</ul>`
    );
    
    // Replace URLs with clickable links
    const withLinks = withLists.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-blue-600 underline">$1</a>'
    );
    
    // Replace new lines with <br>
    return withLinks.replace(/\n/g, '<br>');
  };

  return (
    <MainLayout>
      <div className="mediflow-container py-6 flex flex-col h-[calc(100vh-180px)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Health Assistant</h1>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  About AI Assistant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>About the MediFlow AI Health Assistant</DialogTitle>
                  <DialogDescription>
                    Powered by advanced language models for personalized health guidance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Symptom Assessment</Badge>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Medication Information</Badge>
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Health Education</Badge>
                      </div>
                      <p>The AI assistant can:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Help understand your symptoms and suggest possible causes</li>
                        <li>Provide information about your medications and conditions</li>
                        <li>Prepare questions for your doctor appointments</li>
                        <li>Offer general health guidance and education</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Limitations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">The AI assistant is not a replacement for professional medical advice:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Cannot diagnose conditions with certainty</li>
                        <li>Does not have access to your complete medical history</li>
                        <li>Cannot prescribe medications or treatments</li>
                        <li>May have limited knowledge of very recent medical research</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <p className="text-sm text-gray-500">
                    Always consult with a qualified healthcare provider for medical advice,
                    diagnosis, or treatment. In case of emergency, call your local emergency services immediately.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            
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
                  <div
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    className="chat-message"
                  />
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
        <div className="relative">
          {showSuggestions && (
            <div className="absolute bottom-full mb-2 w-full">
              <Card>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Suggested Questions</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <Command>
                    <CommandInput placeholder="Search suggestions..." />
                    <CommandList>
                      <CommandEmpty>No suggestions found.</CommandEmpty>
                      <CommandGroup>
                        {QUESTION_SUGGESTIONS.map((suggestion, index) => (
                          <CommandItem 
                            key={index} 
                            onSelect={() => handleSelectSuggestion(suggestion)}
                            className="cursor-pointer"
                          >
                            {suggestion}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex items-end space-x-2">
            <div className="flex space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline" 
                    size="icon"
                    type="button"
                    className="h-10 w-10"
                  >
                    <PaperclipIcon className="h-5 w-5 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                  <div className="space-y-2">
                    <h3 className="font-medium">Attach files</h3>
                    <p className="text-sm text-gray-500">Upload medical documents or images to discuss.</p>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="justify-start">
                        <PaperclipIcon className="h-4 w-4 mr-2" />
                        Upload from device
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline" 
                size="icon"
                type="button"
                className="h-10 w-10"
                onClick={handleStartRecording}
              >
                <Mic className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
            
            <div className="flex-grow relative">
              <Textarea
                ref={textareaRef}
                className="pr-16 min-h-[2.5rem] max-h-[150px] resize-none"
                placeholder="Type your message or ask a health question..."
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyPress}
                rows={1}
              />
              
              {!showSuggestions && !message && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowSuggestions(true)}
                >
                  Suggestions
                </Button>
              )}
              
              <Button 
                className="absolute right-1 top-1 bottom-1" 
                size="sm"
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
