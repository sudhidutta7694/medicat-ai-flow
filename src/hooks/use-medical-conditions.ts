
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MedicalCondition {
  id: string;
  user_id: string;
  name: string;
  diagnosed_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export const useMedicalConditions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);

  const fetchConditions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_conditions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConditions(data || []);
    } catch (error: any) {
      console.error('Error fetching medical conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, [user]);

  const addCondition = async (conditionData: Omit<MedicalCondition, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medical_conditions')
        .insert([
          {
            ...conditionData,
            user_id: user.id,
          },
        ]);

      if (error) throw error;
      
      toast({
        title: 'Condition added',
        description: 'Medical condition has been added successfully.',
      });
      
      // Refresh the list
      fetchConditions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while adding the condition.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCondition = async (id: string, conditionData: Partial<Omit<MedicalCondition, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medical_conditions')
        .update(conditionData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Condition updated',
        description: 'Medical condition has been updated successfully.',
      });
      
      // Refresh the list
      fetchConditions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while updating the condition.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCondition = async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('medical_conditions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Condition deleted',
        description: 'Medical condition has been deleted successfully.',
      });
      
      // Refresh the list
      fetchConditions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while deleting the condition.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { conditions, loading, addCondition, updateCondition, deleteCondition };
};
