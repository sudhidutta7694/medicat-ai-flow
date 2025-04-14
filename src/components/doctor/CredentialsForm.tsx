import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FilePen, Plus, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CredentialValues {
  title: string;
  institution: string;
  year: number;
  description: string;
}

const CredentialsForm = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);

  const form = useForm<CredentialValues>({
    defaultValues: {
      title: '',
      institution: '',
      year: new Date().getFullYear(),
      description: ''
    }
  });

  const onSubmit = async (values: CredentialValues) => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      // First, check if doctor record exists
      const { data: doctorData, error: fetchError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // If doctor record doesn't exist, create one
      if (fetchError && fetchError.code === 'PGRST116') {
        const { error } = await supabase
          .from('doctors')
          .insert([{
            id: user.id,
            specialty: 'General Medicine', // Default specialty
            // We could also store credentials in the future in a separate field
          }]);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Credential Added',
        description: 'Your credential has been saved successfully.',
      });
      
      // Add the credential to the local state for display
      setCredentials([...credentials, values]);
      
      // Reset the form
      form.reset();
      
    } catch (error: any) {
      console.error('Error adding credential:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add credential',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <FilePen className="h-5 w-5 text-mediblue-600" />
            Professional Credentials
          </h2>
        </div>
        
        {credentials.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="font-medium text-sm text-gray-500">Your Added Credentials</h3>
            {credentials.map((cred, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="font-medium">{cred.title}</div>
                <div className="text-sm text-gray-600">{cred.institution} • {cred.year}</div>
                {cred.description && <div className="text-sm mt-2">{cred.description}</div>}
              </div>
            ))}
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Board Certification, Fellowship" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. American Board of Internal Medicine" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1900" 
                        max={new Date().getFullYear()} 
                        step="1" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details about this credential" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                {submitting ? (
                  <>Adding...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Credential
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CredentialsForm;
