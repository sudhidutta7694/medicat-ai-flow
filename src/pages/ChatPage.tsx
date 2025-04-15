import React, { useState, useRef, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Mic, 
  PaperclipIcon, 
  Share, 
  Download, 
  Loader2, 
  Info, 
  Trash2, 
  FileText, 
  Stethoscope
} from 'lucide-react';
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
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription, 
  CardFooter
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PATIENT_QUESTION_SUGGESTIONS = [
  "What are common symptoms of the flu?",
  "How can I manage my diabetes better?",
  "What medications help with migraines?",
  "Should I be concerned about this persistent cough?",
  "What are the side effects of my current medications?",
  "How often should I check my blood pressure?",
  "Can you explain my latest lab results?",
  "What questions should I ask my doctor at my next appointment?"
];

const DOCTOR_QUESTION_SUGGESTIONS = [
  "Help me create a questionnaire for diabetes patients",
  "What are the latest guidelines for hypertension management?",
  "Generate patient education material for asthma",
  "How should I explain this medication's side effects to patients?",
  "What diagnostic criteria should I consider for this symptom cluster?",
  "Generate discharge instructions for post-operative care",
  "What questions should I ask to assess medication adherence?",
  "Create a follow-up protocol for chronic condition management"
];

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    exportChat, 
    shareWithDoctor, 
    clearChat, 
    generateDiagnosticSummary,
    doctorMode
  } = useChat();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const questionSuggestions = doctorMode ? DOCTOR_QUESTION_SUGGESTIONS : PATIENT_QUESTION_SUGGESTIONS;

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

  const handleToggleDoctorMode = () => {
    if (!doctorMode) {
      setDoctorMode(true);
      toast({
        title: "Doctor Mode Enabled",
        description: "Chat is now in clinical professional mode with more detailed medical information."
      });
      clearChat();
    } else {
      setDoctorMode(false);
      toast({
        title: "Patient Mode Enabled",
        description: "Chat is now in patient-friendly mode."
      });
      clearChat();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessage = (content: string) => {
    let formattedContent = content.replace(/^##\s(.*)$/gm, '<h3 class="text-lg font-bold mt-2 mb-1">$1</h3>');
    
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    formattedContent = formattedContent.replace(
      /(\n\s*(\*|\-)\s.*)+/g, 
      match => `<ul class="list-disc pl-5 my-2">${match.replace(/\n\s*(\*|\-)\s(.*)/g, '<li>$2</li>')}</ul>`
    );
    
    formattedContent = formattedContent.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-blue-600 underline">$1</a>'
    );
    
    return formattedContent.replace(/\n/g, '<br>');
  };

  return (
    <MainLayout>
      <div className="mediflow-container py-6 flex flex-col h-[calc(100vh-180px)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {doctorMode ? (
                <span className="flex items-center">
                  <Stethoscope className="h-6 w-6 mr-2" />
                  Clinical AI Assistant
                </span>
              ) : (
                "AI Health Assistant"
              )}
            </h1>
            <Badge className={doctorMode ? "bg-indigo-100 text-indigo-800" : "bg-mediblue-100 text-mediblue-800"}>
              {doctorMode ? "Doctor Mode" : "Patient Mode"}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  About
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
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Symptom Assessment</Badge>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Medication Information</Badge>
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Health Education</Badge>
                        {doctorMode && (
                          <>
                            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Patient Questionnaires</Badge>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Clinical Decision Support</Badge>
                          </>
                        )}
                      </div>
                      <p>The AI assistant can:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Help understand your symptoms and suggest possible causes</li>
                        <li>Provide information about your medications and conditions</li>
                        <li>Prepare questions for your doctor appointments</li>
                        <li>Offer general health guidance and education</li>
                        {doctorMode && (
                          <>
                            <li>Help create custom questionnaires for patient assessment</li>
                            <li>Generate patient education materials</li>
                            <li>Provide clinical decision support based on evidence</li>
                          </>
                        )}
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
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={exportChat}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {doctorMode && (
              <Button variant="outline" size="sm" onClick={generateDiagnosticSummary}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Summary
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear conversation history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The current conversation will be cleared.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearChat}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <div className={cn(
          "medical-info mb-4 p-3 rounded-md border",
          doctorMode 
            ? "bg-indigo-50 border-indigo-100" 
            : "bg-blue-50 border-blue-100"
        )}>
          <h3 className="font-medium">
            {doctorMode ? "Clinical Mode" : "Important Notice"}
          </h3>
          <p className="text-sm">
            {doctorMode
              ? "You are in doctor mode. This assistant provides clinical decision support and can help you prepare patient materials. Always apply clinical judgment."
              : "This AI assistant provides general health information and is not a substitute for professional medical advice. Always consult with your healthcare provider for diagnosis and treatment."
            }
          </p>
        </div>

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
                      : doctorMode
                        ? "bg-white border border-indigo-200 rounded-bl-none"
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
                <div className={cn(
                  "p-4 max-w-md rounded-lg rounded-bl-none border",
                  doctorMode
                    ? "bg-white border-indigo-200"
                    : "bg-white border-gray-200"
                )}>
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      doctorMode ? "bg-indigo-500" : "bg-mediblue-500"
                    )}></div>
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse delay-150",
                      doctorMode ? "bg-indigo-500" : "bg-mediblue-500"
                    )}></div>
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse delay-300",
                      doctorMode ? "bg-indigo-500" : "bg-mediblue-500"
                    )}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>
        </div>

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
                        {questionSuggestions.map((suggestion, index) => (
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
                className={cn(
                  "pr-16 min-h-[2.5rem] max-h-[150px] resize-none",
                  doctorMode && "border-indigo-200 focus-visible:ring-indigo-400"
                )}
                placeholder={doctorMode 
                  ? "Enter clinical questions or request patient materials..." 
                  : "Type your message or ask a health question..."
                }
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
                className={cn(
                  "absolute right-1 top-1 bottom-1",
                  doctorMode && "bg-indigo-600 hover:bg-indigo-700"
                )} 
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
