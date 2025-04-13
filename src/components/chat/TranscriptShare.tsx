
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Send, Download, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TranscriptShareProps {
  messages: any[];
  title: string;
}

const TranscriptShare: React.FC<TranscriptShareProps> = ({ messages, title }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  const form = useForm({
    defaultValues: {
      doctorId: '',
      notes: '',
    },
  });

  const loadDoctors = async () => {
    if (doctors.length > 0) return; // Already loaded
    
    try {
      setLoadingDoctors(true);
      
      // First, get profiles with user_type = 'doctor'
      const { data: doctorProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('user_type', 'doctor');
      
      if (profilesError) throw profilesError;
      
      // Then, get doctor specialties
      const { data: doctorSpecialties, error: specialtiesError } = await supabase
        .from('doctors')
        .select('id, specialty');
        
      if (specialtiesError) throw specialtiesError;
      
      // Combine the data
      const doctorsWithDetails = doctorProfiles.map(profile => {
        const doctorInfo = doctorSpecialties.find(d => d.id === profile.id);
        return {
          id: profile.id,
          first_name: profile.first_name || 'Unknown',
          last_name: profile.last_name || '',
          specialty: doctorInfo?.specialty || 'General',
          fullName: `Dr. ${profile.first_name || 'Unknown'} ${profile.last_name || ''} (${doctorInfo?.specialty || 'General'})`
        };
      });
      
      setDoctors(doctorsWithDetails);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      toast({
        title: 'Error',
        description: 'Could not load available doctors',
        variant: 'destructive',
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const formatTranscript = () => {
    const formattedDate = new Date().toLocaleDateString();
    let transcript = `# AI Chat Transcript\n\n`;
    transcript += `**Date**: ${formattedDate}\n`;
    transcript += `**Title**: ${title || 'Untitled conversation'}\n\n`;
    
    messages.forEach(msg => {
      const role = msg.role === 'user' ? 'Patient' : 'AI Assistant';
      transcript += `**${role}**: ${msg.content}\n\n`;
    });
    
    return transcript;
  };

  const downloadTranscript = () => {
    const transcript = formatTranscript();
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareWithDoctor = async (values: any) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const transcript = formatTranscript();
      
      // Create a medical event for the transcript
      const { error } = await supabase.from('medical_events').insert({
        user_id: user.id,
        title: `AI Chat Transcript: ${title || 'Consultation'}`,
        description: `${values.notes}\n\n${transcript}`,
        type: 'medical_ai_transcript',
        date: new Date().toISOString(),
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Transcript shared with your doctor successfully',
      });
      
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not share transcript',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={downloadTranscript}>
        <Download className="h-4 w-4 mr-2" /> Export
      </Button>
      
      <Dialog onOpenChange={loadDoctors}>
        <DialogTrigger asChild>
          <Button>
            <Share2 className="h-4 w-4 mr-2" /> Share with Doctor
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Chat Transcript</DialogTitle>
            <DialogDescription>
              Share this AI chat transcript with your healthcare provider
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(shareWithDoctor)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Doctor</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loadingDoctors}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDoctors ? 'Loading doctors...' : 'Select a doctor'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map(doctor => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the healthcare provider you want to share this transcript with
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any context or notes for your doctor about this conversation"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sharing...' : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> Share Transcript
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranscriptShare;
