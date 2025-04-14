
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Briefcase, Plus, Save } from 'lucide-react';

interface SpecialtyFormValues {
  specialty: string;
  qualification: string;
  experience_years: number;
}

const SpecialtiesForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [doctorData, setDoctorData] = useState<any>(null);

  const form = useForm<SpecialtyFormValues>({
    defaultValues: {
      specialty: '',
      qualification: '',
      experience_years: 0
    }
  });

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching doctor data:', error);
          return;
        }
        
        if (data) {
          setDoctorData(data);
          form.reset({
            specialty: data.specialty || '',
            qualification: data.qualification || '',
            experience_years: data.experience_years || 0
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorData();
  }, [user, form]);

  const onSubmit = async (values: SpecialtyFormValues) => {
    if (!user) return;
    
    try {
      setUpdating(true);
      
      const doctorInfo = {
        id: user.id,
        specialty: values.specialty,
        qualification: values.qualification,
        experience_years: values.experience_years
      };
      
      // If doctor record exists, update it; otherwise, insert new record
      let query;
      if (doctorData) {
        query = supabase
          .from('doctors')
          .update(doctorInfo)
          .eq('id', user.id);
      } else {
        query = supabase
          .from('doctors')
          .insert([doctorInfo]);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Your specialty information has been updated.',
      });
      
      // Update the doctorData state
      setDoctorData({ ...doctorData, ...doctorInfo });
      
    } catch (error: any) {
      console.error('Error updating doctor specialty:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update specialty information',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediblue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-mediblue-600" />
            Your Specialties & Expertise
          </h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical Specialty</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Cardiology, Dermatology, Neurology" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="qualification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qualification</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MD, MBBS, MS, DNB" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="experience_years"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="1" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={updating} className="flex items-center gap-2">
                {updating ? (
                  <>Updating...</>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Specialty
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

export default SpecialtiesForm;
