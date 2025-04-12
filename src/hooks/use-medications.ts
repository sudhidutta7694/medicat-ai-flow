
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
}

export const useMedications = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);

  const fetchMedications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error: any) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [user]);

  const addMedication = async (medicationData: Omit<Medication, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medications')
        .insert([
          {
            ...medicationData,
            user_id: user.id,
          },
        ]);

      if (error) throw error;
      
      toast({
        title: 'Medication added',
        description: 'Medication has been added successfully.',
      });
      
      // Refresh the list
      fetchMedications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while adding the medication.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMedication = async (id: string, medicationData: Partial<Omit<Medication, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medications')
        .update(medicationData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Medication updated',
        description: 'Medication has been updated successfully.',
      });
      
      // Refresh the list
      fetchMedications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while updating the medication.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMedication = async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Medication deleted',
        description: 'Medication has been deleted successfully.',
      });
      
      // Refresh the list
      fetchMedications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while deleting the medication.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { medications, loading, addMedication, updateMedication, deleteMedication };
};
